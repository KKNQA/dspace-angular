import {
  AsyncPipe,
  NgTemplateOutlet,
} from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HomeCoarComponent } from '../../../../app/home-page/home-coar/home-coar.component';
import { ThemedHomeNewsComponent } from '../../../../app/home-page/home-news/themed-home-news.component';
import { HomePageComponent as BaseComponent } from '../../../../app/home-page/home-page.component';
import { ThemedTopLevelCommunityListComponent } from '../../../../app/home-page/top-level-community-list/themed-top-level-community-list.component';
import { SuggestionsPopupComponent } from '../../../../app/notifications/suggestions/popup/suggestions-popup.component';
import { ThemedConfigurationSearchPageComponent } from '../../../../app/search-page/themed-configuration-search-page.component';
import { FeaturedPublicationsComponent } from './featured-publications/featured-publications.component';
import { RecentItemListComponent } from './recent-item-list/recent-item-list.component';
import { RepositoryInsightsComponent } from './repository-insights/repository-insights.component';
import { TopCollectionsComponent } from './top-collections/top-collections.component';

/**
 * KNQA home page: hero with search & stats (home-news), browse-communities card grid,
 * featured publications with the repository-insights sidebar, and recent submissions.
 */
@Component({
  selector: 'ds-themed-home-page',
  styleUrls: ['./home-page.component.scss'],
  templateUrl: './home-page.component.html',
  imports: [
    AsyncPipe,
    FeaturedPublicationsComponent,
    HomeCoarComponent,
    NgTemplateOutlet,
    RecentItemListComponent,
    RepositoryInsightsComponent,
    SuggestionsPopupComponent,
    ThemedConfigurationSearchPageComponent,
    ThemedHomeNewsComponent,
    ThemedTopLevelCommunityListComponent,
    TopCollectionsComponent,
    TranslateModule,
  ],
})
export class HomePageComponent extends BaseComponent {
}
