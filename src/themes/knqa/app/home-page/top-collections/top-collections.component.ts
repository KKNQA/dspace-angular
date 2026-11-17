import { AsyncPipe } from '@angular/common';
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

import { getCollectionPageRoute } from '../../../../../app/collection-page/collection-page-routing-paths';
import { CollectionDataService } from '../../../../../app/core/data/collection-data.service';
import { Collection } from '../../../../../app/core/shared/collection.model';
import { DSpaceObjectType } from '../../../../../app/core/shared/dspace-object-type.model';
import { getFirstCompletedRemoteData } from '../../../../../app/core/shared/operators';
import { SearchService } from '../../../../../app/core/shared/search/search.service';
import { PaginationComponentOptions } from '../../../../../app/shared/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from '../../../../../app/shared/search/models/paginated-search-options.model';

/**
 * How many collections end up in the list.
 */
export const TOP_COLLECTIONS_LIMIT = 3;

/**
 * How many collections are measured to find those top few. Discovery has no
 * collection facet out of the box, so item counts are gathered per collection —
 * one (parallel) request each. Keep this modest on large repositories.
 */
export const TOP_COLLECTIONS_SAMPLE_SIZE = 20;

export interface RankedCollection {
  name: string;
  route: string;
  count: number;
}

/**
 * KNQA "Top Collections": the small ranked list under the insights panel
 * (Stitch homepage design).
 */
@Component({
  selector: 'ds-knqa-top-collections',
  templateUrl: './top-collections.component.html',
  styleUrls: ['./top-collections.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    TranslateModule,
  ],
})
export class TopCollectionsComponent implements OnInit {

  collections$: Observable<RankedCollection[]>;

  constructor(
    private collectionDataService: CollectionDataService,
    private searchService: SearchService,
  ) {
  }

  ngOnInit(): void {
    this.collections$ = this.collectionDataService.findAll({
      elementsPerPage: TOP_COLLECTIONS_SAMPLE_SIZE,
    }).pipe(
      getFirstCompletedRemoteData(),
      switchMap((rd) => {
        const collections: Collection[] = rd.hasSucceeded ? rd.payload?.page ?? [] : [];
        return collections.length > 0
          ? forkJoin(collections.map((collection) => this.rank(collection)))
          : of([] as RankedCollection[]);
      }),
      map((ranked) => ranked
        .filter((collection) => collection.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_COLLECTIONS_LIMIT),
      ),
      catchError(() => of([] as RankedCollection[])),
    );
  }

  /**
   * Count the archived items inside one collection.
   */
  private rank(collection: Collection): Observable<RankedCollection> {
    const pagination = Object.assign(new PaginationComponentOptions(), {
      id: `knqa-top-collection-${collection.uuid}`,
      pageSize: 1,
      currentPage: 1,
    });
    return this.searchService.search(new PaginatedSearchOptions({
      pagination,
      scope: collection.uuid,
      dsoTypes: [DSpaceObjectType.ITEM],
    })).pipe(
      getFirstCompletedRemoteData(),
      map((rd) => rd.hasSucceeded ? rd.payload?.totalElements ?? 0 : 0),
      catchError(() => of(0)),
      map((count) => ({
        name: collection.name,
        route: getCollectionPageRoute(collection.uuid),
        count,
      })),
    );
  }

  /**
   * Abbreviate the count badge the way the design does: 4200 -> "4.2k".
   */
  compact(value: number): string {
    if (value >= 1_000) {
      return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return `${value}`;
  }

}
