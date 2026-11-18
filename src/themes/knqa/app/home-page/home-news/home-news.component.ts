import {
  AsyncPipe,
  DecimalPipe,
} from '@angular/common';
import {
  Component,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CollectionDataService } from '../../../../../app/core/data/collection-data.service';
import { CommunityDataService } from '../../../../../app/core/data/community-data.service';
import { DSpaceObjectType } from '../../../../../app/core/shared/dspace-object-type.model';
import { getFirstSucceededRemoteData } from '../../../../../app/core/shared/operators';
import { SearchService } from '../../../../../app/core/shared/search/search.service';
import { HomeNewsComponent as BaseComponent } from '../../../../../app/home-page/home-news/home-news.component';
import { PaginationComponentOptions } from '../../../../../app/shared/pagination/pagination-component-options.model';
import { PaginatedSearchOptions } from '../../../../../app/shared/search/models/paginated-search-options.model';
import { ThemedSearchFormComponent } from '../../../../../app/shared/search-form/themed-search-form.component';

/**
 * KNQA homepage hero: repository title, mission statement, a large central search box
 * and live repository statistics (publications / communities / collections).
 */
@Component({
  selector: 'ds-themed-home-news',
  styleUrls: ['./home-news.component.scss'],
  templateUrl: './home-news.component.html',
  imports: [
    AsyncPipe,
    DecimalPipe,
    ThemedSearchFormComponent,
    TranslateModule,
  ],
})
export class HomeNewsComponent extends BaseComponent implements OnInit {

  totalItems$: Observable<number>;
  totalCommunities$: Observable<number>;
  totalCollections$: Observable<number>;

  constructor(
    private searchService: SearchService,
    private communityDataService: CommunityDataService,
    private collectionDataService: CollectionDataService,
  ) {
    super();
  }

  ngOnInit(): void {
    const pagination = Object.assign(new PaginationComponentOptions(), {
      id: 'knqa-hero-stats',
      pageSize: 1,
      currentPage: 1,
    });
    this.totalItems$ = this.searchService.search(new PaginatedSearchOptions({
      pagination,
      dsoTypes: [DSpaceObjectType.ITEM],
    })).pipe(
      getFirstSucceededRemoteData(),
      map((rd) => rd.payload.totalElements),
    );
    this.totalCommunities$ = this.communityDataService.findAll({ elementsPerPage: 1 }).pipe(
      getFirstSucceededRemoteData(),
      map((rd) => rd.payload.totalElements),
    );
    this.totalCollections$ = this.collectionDataService.findAll({ elementsPerPage: 1 }).pipe(
      getFirstSucceededRemoteData(),
      map((rd) => rd.payload.totalElements),
    );
  }
}
