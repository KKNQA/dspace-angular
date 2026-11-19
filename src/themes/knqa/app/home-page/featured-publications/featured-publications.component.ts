import {
  AsyncPipe,
  DatePipe,
  DecimalPipe,
} from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  forkJoin,
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  map,
  switchMap,
} from 'rxjs/operators';

import { getBitstreamDownloadRoute } from '../../../../../app/app-routing-paths';
import {
  SortDirection,
  SortOptions,
} from '../../../../../app/core/cache/models/sort-options.model';
import { BitstreamDataService } from '../../../../../app/core/data/bitstream-data.service';
import { PaginatedList } from '../../../../../app/core/data/paginated-list.model';
import { RemoteData } from '../../../../../app/core/data/remote-data';
import { Bitstream } from '../../../../../app/core/shared/bitstream.model';
import { DSpaceObjectType } from '../../../../../app/core/shared/dspace-object-type.model';
import { Item } from '../../../../../app/core/shared/item.model';
import {
  getFirstCompletedRemoteData,
  toDSpaceObjectListRD,
} from '../../../../../app/core/shared/operators';
import { SearchService } from '../../../../../app/core/shared/search/search.service';
import { UsageReport } from '../../../../../app/core/statistics/models/usage-report.model';
import { UsageReportDataService } from '../../../../../app/core/statistics/usage-report-data.service';
import { getItemPageRoute } from '../../../../../app/item-page/item-page-routing-paths';
import { fadeIn } from '../../../../../app/shared/animations/fade';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { PaginationComponentOptions } from '../../../../../app/shared/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from '../../../../../app/shared/search/models/paginated-search-options.model';
import {
  followLink,
  FollowLinkConfig,
} from '../../../../../app/shared/utils/follow-link-config.model';

/**
 * How many publications the section shows. The Stitch design lays out two
 * cards side by side; a larger value simply wraps onto further rows.
 */
export const FEATURED_PAGE_SIZE = 2;

/**
 * Discovery query that decides *which* publications are featured. Empty means
 * "any item", so the section falls back to the most recently issued ones.
 *
 * To curate the section by hand, give the chosen items a shared metadata value
 * and put the matching query here, e.g. `dc.subject:"knqa-featured"`.
 */
export const FEATURED_QUERY = '';

/**
 * The bundle featured downloads are taken from.
 */
const ORIGINAL_BUNDLE = 'ORIGINAL';

/**
 * A publication card, with everything the template needs already resolved.
 */
export interface FeaturedPublication {
  item: Item;
  route: string;
  title: string;
  /** Owning collection name — the coloured pill above the title. */
  category: string;
  /** Depositing body from dc.publisher; null when the item doesn't name one. */
  department: string;
  issued: string;
  /** Cover art from the item thumbnail; null renders the branded fallback. */
  coverSrc: string;
  /** Total downloads, or null when the item has no file or no statistics. */
  downloads: number;
  /** Route of the downloadable file, or null when the item is metadata-only. */
  downloadRoute: string;
}

/**
 * KNQA "Featured Publications": a grid of publication cards, each with cover
 * art, its collection, the depositing department and a download action
 * (Stitch homepage design).
 */
@Component({
  selector: 'ds-knqa-featured-publications',
  templateUrl: './featured-publications.component.html',
  styleUrls: ['./featured-publications.component.scss'],
  animations: [fadeIn],
  imports: [
    AsyncPipe,
    DatePipe,
    DecimalPipe,
    ErrorComponent,
    RouterLink,
    ThemedLoadingComponent,
    TranslateModule,
  ],
})
export class FeaturedPublicationsComponent implements OnInit {

  /** null while loading, [] when nothing could be resolved. */
  publications$: Observable<FeaturedPublication[]>;

  failed = false;

  constructor(
    private searchService: SearchService,
    private bitstreamDataService: BitstreamDataService,
    private usageReportService: UsageReportDataService,
  ) {
  }

  ngOnInit(): void {
    const pagination = Object.assign(new PaginationComponentOptions(), {
      id: 'knqa-featured',
      pageSize: FEATURED_PAGE_SIZE,
      currentPage: 1,
    });

    // Typed as Item links so the follow-link generic resolves to Item rather
    // than the search result's own (self-only) link set.
    const linksToFollow: FollowLinkConfig<Item>[] = [
      followLink('thumbnail'),
      followLink('owningCollection'),
    ];

    this.publications$ = (this.searchService.search(
      new PaginatedSearchOptions({
        pagination,
        // Omitted rather than sent empty, so the request matches a plain browse
        query: FEATURED_QUERY || undefined,
        dsoTypes: [DSpaceObjectType.ITEM],
        sort: new SortOptions('dc.date.issued', SortDirection.DESC),
      }),
      undefined,
      undefined,
      undefined,
      ...linksToFollow,
    ).pipe(
      toDSpaceObjectListRD(),
    ) as Observable<RemoteData<PaginatedList<Item>>>).pipe(
      getFirstCompletedRemoteData(),
      switchMap((rd) => {
        this.failed = rd.hasFailed;
        const items: Item[] = rd.hasSucceeded ? rd.payload?.page ?? [] : [];
        return items.length > 0
          ? forkJoin(items.map((item) => this.toPublication(item)))
          : of([] as FeaturedPublication[]);
      }),
    );
  }

  /**
   * Resolve the extras a card needs on top of the item metadata. The download
   * count is only requested when the item actually has a file — a metadata-only
   * record can never have been downloaded.
   */
  private toPublication(item: Item): Observable<FeaturedPublication> {
    return this.resolveFile(item).pipe(
      switchMap((file) => forkJoin({
        file: of(file),
        downloads: file ? this.resolveDownloads(item) : of(null),
        category: this.resolveCategory(item),
        coverSrc: this.resolveCover(item),
      })),
      map(({ file, downloads, category, coverSrc }) => ({
        item,
        route: getItemPageRoute(item),
        title: item.firstMetadataValue('dc.title'),
        category,
        // No fallback: the owning collection is already shown as the pill
        // above, so repeating it here would just be noise.
        department: item.firstMetadataValue('dc.publisher'),
        issued: item.firstMetadataValue(['dc.date.issued', 'dc.date.accessioned']),
        coverSrc,
        downloads,
        downloadRoute: file ? getBitstreamDownloadRoute(file) : null,
      })),
    );
  }

  /**
   * The owning collection name, used both as the card's category pill and as
   * the department fallback. Resolved from the followed link, so no extra
   * request is made.
   */
  private resolveCategory(item: Item): Observable<string> {
    if (!item.owningCollection) {
      return of(null);
    }
    return item.owningCollection.pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.name ?? null : null),
      catchError(() => of(null)),
    );
  }

  /**
   * The thumbnail's content URL, or null when the item has no thumbnail — in
   * which case the template falls back to the branded cover panel rather than
   * DSpace's "no thumbnail" placeholder, which the design has no room for.
   */
  private resolveCover(item: Item): Observable<string> {
    if (!item.thumbnail) {
      return of(null);
    }
    return item.thumbnail.pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?._links?.content?.href ?? null : null),
      catchError(() => of(null)),
    );
  }

  /**
   * The first file in the ORIGINAL bundle, which the Download button points at.
   */
  private resolveFile(item: Item): Observable<Bitstream> {
    return this.bitstreamDataService.findAllByItemAndBundleName(
      item, ORIGINAL_BUNDLE, { elementsPerPage: 1 }, true, false,
    ).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.page?.[0] ?? null : null),
      catchError(() => of(null)),
    );
  }

  /**
   * Total downloads from the Solr statistics core. Null (rather than 0) when
   * the report is unavailable, so the template can hide the counter instead of
   * claiming zero downloads.
   */
  private resolveDownloads(item: Item): Observable<number> {
    return this.usageReportService.findById(`${item.uuid}_TotalDownloads`, true, false).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? this.sumViews(rd.payload) : null),
      catchError(() => of(null)),
    );
  }

  /**
   * Add up a usage report's data points. `values` is documented as a list but
   * comes back as a bare object for single-value reports, so both are handled.
   */
  private sumViews(report: UsageReport): number {
    return (report?.points ?? []).reduce((total, point) => {
      const values: any = point?.values;
      if (Array.isArray(values)) {
        return total + values.reduce((sum, value) => sum + (Number(value?.views) || 0), 0);
      }
      return total + (Number(values?.views) || 0);
    }, 0);
  }

}
