import { AsyncPipe } from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  Observable,
  of,
} from 'rxjs';
import {
  catchError,
  map,
} from 'rxjs/operators';

import { BrowseService } from '../../../../../app/core/browse/browse.service';
import { BrowseEntrySearchOptions } from '../../../../../app/core/browse/browse-entry-search-options.model';
import { CollectionDataService } from '../../../../../app/core/data/collection-data.service';
import { CommunityDataService } from '../../../../../app/core/data/community-data.service';
import { DSpaceObjectType } from '../../../../../app/core/shared/dspace-object-type.model';
import { getFirstCompletedRemoteData } from '../../../../../app/core/shared/operators';
import { SearchService } from '../../../../../app/core/shared/search/search.service';
import { PaginationComponentOptions } from '../../../../../app/shared/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from '../../../../../app/shared/search/models/paginated-search-options.model';

/**
 * The `dc.type` values behind the two publication-kind tiles. Change these to
 * match the vocabulary your submission forms actually use.
 */
export const RESEARCH_PAPER_TYPE = 'Article';
export const REPORT_TYPE = 'Report';

/**
 * The metadata browse index the contributor count is read from.
 */
const CONTRIBUTOR_INDEX = 'author';

/**
 * KNQA "Repository Insights": the blue statistics panel beside the featured
 * publications (Stitch homepage design).
 *
 * Every figure is read live from the REST API. Note that DSpace exposes usage
 * statistics per object only — there is no site-wide download total — so the
 * design's "Downloads" tile is served by the collection count instead.
 */
@Component({
  selector: 'ds-knqa-repository-insights',
  templateUrl: './repository-insights.component.html',
  styleUrls: ['./repository-insights.component.scss'],
  imports: [
    AsyncPipe,
    TranslateModule,
  ],
})
export class RepositoryInsightsComponent implements OnInit {

  totalItems$: Observable<number>;
  totalCommunities$: Observable<number>;
  totalCollections$: Observable<number>;
  totalResearchPapers$: Observable<number>;
  totalReports$: Observable<number>;
  totalContributors$: Observable<number>;

  constructor(
    private searchService: SearchService,
    private communityDataService: CommunityDataService,
    private collectionDataService: CollectionDataService,
    private browseService: BrowseService,
  ) {
  }

  ngOnInit(): void {
    this.totalItems$ = this.countItems('knqa-insights-items');
    this.totalResearchPapers$ = this.countItems('knqa-insights-papers', `dc.type:"${RESEARCH_PAPER_TYPE}"`);
    this.totalReports$ = this.countItems('knqa-insights-reports', `dc.type:"${REPORT_TYPE}"`);

    this.totalCommunities$ = this.communityDataService.findAll({ elementsPerPage: 1 }).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.totalElements ?? null : null),
      catchError(() => of(null)),
    );

    this.totalCollections$ = this.collectionDataService.findAll({ elementsPerPage: 1 }).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.totalElements ?? null : null),
      catchError(() => of(null)),
    );

    // Distinct values in the author browse index — i.e. everyone who has
    // contributed a deposit, which is what the design's badge counts.
    const contributorPagination = Object.assign(new PaginationComponentOptions(), {
      id: 'knqa-insights-contributors',
      pageSize: 1,
      currentPage: 1,
    });
    this.totalContributors$ = this.browseService.getBrowseEntriesFor(
      new BrowseEntrySearchOptions(CONTRIBUTOR_INDEX, contributorPagination),
    ).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.totalElements ?? null : null),
      catchError(() => of(null)),
    );
  }

  /**
   * Total archived items matching an optional Discovery query.
   */
  private countItems(paginationId: string, query?: string): Observable<number> {
    const pagination = Object.assign(new PaginationComponentOptions(), {
      id: paginationId,
      pageSize: 1,
      currentPage: 1,
    });
    return this.searchService.search(new PaginatedSearchOptions({
      pagination,
      query,
      dsoTypes: [DSpaceObjectType.ITEM],
    })).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.totalElements ?? null : null),
      catchError(() => of(null)),
    );
  }

  /**
   * Abbreviate large figures the way the design does: 12400 -> "12.4K".
   * Values under a thousand are shown in full.
   */
  compact(value: number): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value >= 1_000_000) {
      return this.trimZero(value / 1_000_000) + 'M';
    }
    if (value >= 1_000) {
      return this.trimZero(value / 1_000) + 'K';
    }
    return `${value}`;
  }

  private trimZero(value: number): string {
    return value.toFixed(1).replace(/\.0$/, '');
  }

}
