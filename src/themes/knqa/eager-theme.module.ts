import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { RootModule } from '../../app/root.module';
import { JournalComponent } from './app/entity-groups/journal-entities/item-pages/journal/journal.component';
import { JournalIssueComponent } from './app/entity-groups/journal-entities/item-pages/journal-issue/journal-issue.component';
import { JournalVolumeComponent } from './app/entity-groups/journal-entities/item-pages/journal-volume/journal-volume.component';
import { PersonComponent } from './app/entity-groups/research-entities/item-pages/person/person.component';
import { FooterComponent } from './app/footer/footer.component';
import { HeaderComponent } from './app/header/header.component';
import { HeaderNavbarWrapperComponent } from './app/header-nav-wrapper/header-navbar-wrapper.component';
import { HomeNewsComponent } from './app/home-page/home-news/home-news.component';
import { TopLevelCommunityListComponent } from './app/home-page/top-level-community-list/top-level-community-list.component';
import { PublicationComponent } from './app/item-page/simple/item-types/publication/publication.component';
import { UntypedItemComponent } from './app/item-page/simple/item-types/untyped-item/untyped-item.component';
import { NavbarComponent } from './app/navbar/navbar.component';
import { EditItemSelectorComponent } from './app/shared/dso-selector/modal-wrappers/edit-item-selector/edit-item-selector.component';
import { BrowseEntryListElementComponent } from './app/shared/object-list/browse-entry-list-element/browse-entry-list-element.component';
import { CollectionListElementComponent } from './app/shared/object-list/collection-list-element/collection-list-element.component';
import { CommunityListElementComponent } from './app/shared/object-list/community-list-element/community-list-element.component';
import { ItemSearchResultListElementComponent } from './app/shared/object-list/search-result-list-element/item-search-result/item-types/item/item-search-result-list-element.component';
import { PublicationSidebarSearchListElementComponent } from './app/shared/object-list/sidebar-search-list-element/item-types/publication/publication-sidebar-search-list-element.component';

/**
 * Add components that use a custom decorator to ENTRY_COMPONENTS as well as DECLARATIONS.
 * This will ensure that decorator gets picked up when the app loads
 */
const ENTRY_COMPONENTS = [
  JournalComponent,
  JournalIssueComponent,
  JournalVolumeComponent,
  PersonComponent,
  PublicationComponent,
  UntypedItemComponent,
  CommunityListElementComponent,
  CollectionListElementComponent,
  PublicationSidebarSearchListElementComponent,
  ItemSearchResultListElementComponent,
  TopLevelCommunityListComponent,
  BrowseEntryListElementComponent,
];

const DECLARATIONS = [
  ...ENTRY_COMPONENTS,
  HomeNewsComponent,
  HeaderComponent,
  HeaderNavbarWrapperComponent,
  NavbarComponent,
  FooterComponent,
  EditItemSelectorComponent,
];

@NgModule({
  imports: [
    CommonModule,
    RootModule,
    ...DECLARATIONS,
  ],
  providers: [
    ...ENTRY_COMPONENTS.map((component) => ({ provide: component })),
  ],
})
/**
 * This module is included in the main bundle that gets downloaded at first page load. So it should
 * contain only the themed components that have to be available immediately for the first page load,
 * and the minimal set of imports required to make them work. Anything you can cut from it will make
 * the initial page load faster, but may cause the page to flicker as components that were already
 * rendered server side need to be lazy-loaded again client side
 *
 * Themed EntryComponents should also be added here
 */
export class EagerThemeModule {
}
