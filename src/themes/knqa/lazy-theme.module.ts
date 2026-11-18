import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxGalleryModule } from '@kolkov/ngx-gallery';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollToModule } from '@nicky-lenaers/ngx-scroll-to';

import { RootModule } from '../../app/root.module';
import { SearchResultsSkeletonComponent } from '../../app/shared/search/search-results/search-results-skeleton/search-results-skeleton.component';
import { CommunityListComponent } from './app/community-list-page/community-list/community-list.component';
import { HomePageComponent } from './app/home-page/home-page.component';
import { LoginPageComponent } from './app/login-page/login-page.component';
import { AccessStatusBadgeComponent } from './app/shared/object-collection/shared/badges/access-status-badge/access-status-badge.component';
import { SearchFiltersComponent } from './app/shared/search/search-filters/search-filters.component';
import { SearchSettingsComponent } from './app/shared/search/search-settings/search-settings.component';
import { SearchSidebarComponent } from './app/shared/search/search-sidebar/search-sidebar.component';

const DECLARATIONS = [
  HomePageComponent,
  LoginPageComponent,
  CommunityListComponent,
  SearchSettingsComponent,
  SearchFiltersComponent,
  SearchSidebarComponent,
  AccessStatusBadgeComponent,
  SearchResultsSkeletonComponent,
];

@NgModule({
  imports: [RootModule,
    CommonModule,
    DragDropModule,
    FormsModule,
    NgbModule,
    RouterModule,
    ScrollToModule,
    StoreModule,
    StoreRouterConnectingModule,
    TranslateModule,
    FormsModule,
    NgxGalleryModule,
    ...DECLARATIONS],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
  ],
})

/**
   * This module serves as an index for all the components in this theme.
   * It should import all other modules, so the compiler knows where to find any components referenced
   * from a component in this theme
   * It is purposefully not exported, it should never be imported anywhere else, its only purpose is
   * to give lazily loaded components a context in which they can be compiled successfully
   */
class LazyThemeModule {
}
