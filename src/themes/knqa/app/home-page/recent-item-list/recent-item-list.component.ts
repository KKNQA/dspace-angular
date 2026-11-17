import {
  AsyncPipe,
  DatePipe,
} from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Item } from '../../../../../app/core/shared/item.model';
import { RecentItemListComponent as BaseComponent } from '../../../../../app/home-page/recent-item-list/recent-item-list.component';
import { getItemPageRoute } from '../../../../../app/item-page/item-page-routing-paths';
import {
  fadeIn,
  fadeInOut,
} from '../../../../../app/shared/animations/fade';
import { ErrorComponent } from '../../../../../app/shared/error/error.component';
import { ThemedLoadingComponent } from '../../../../../app/shared/loading/themed-loading.component';
import { VarDirective } from '../../../../../app/shared/utils/var.directive';

/**
 * KNQA "Latest Deposits" section: centered heading with description and an
 * alternating vertical timeline of the most recent submissions (Stitch design).
 */
@Component({
  selector: 'ds-recent-item-list',
  templateUrl: './recent-item-list.component.html',
  styleUrls: ['./recent-item-list.component.scss'],
  animations: [
    fadeIn,
    fadeInOut,
  ],
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    ErrorComponent,
    RouterLink,
    ThemedLoadingComponent,
    TranslateModule,
    VarDirective,
  ],
})
export class RecentItemListComponent extends BaseComponent {

  getItemRoute(item: Item): string {
    return getItemPageRoute(item);
  }

  getTitle(item: Item): string {
    return item.firstMetadataValue('dc.title');
  }

  getAbstract(item: Item): string {
    return item.firstMetadataValue('dc.description.abstract');
  }

  getAuthor(item: Item): string {
    return item.firstMetadataValue('dc.contributor.author');
  }

  /**
   * The deposit date; falls back to the issued date when the accession
   * timestamp is missing.
   */
  getDepositDate(item: Item): string {
    return item.firstMetadataValue(['dc.date.accessioned', 'dc.date.issued']);
  }

  /**
   * Whether the deposit date carries a time component (accession timestamps
   * do, plain issued dates usually don't).
   */
  hasTime(item: Item): boolean {
    const date = this.getDepositDate(item);
    return typeof date === 'string' && date.includes('T');
  }

  /**
   * Translation key for the relative date badge ("Today"/"Yesterday"),
   * or null when the deposit is older and the actual date should be shown.
   */
  dateBadgeKey(item: Item): string | null {
    const value = this.getDepositDate(item);
    if (!value) {
      return null;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return null;
    }
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (this.isSameDay(date, today)) {
      return 'home.knqa.recent.today';
    }
    if (this.isSameDay(date, yesterday)) {
      return 'home.knqa.recent.yesterday';
    }
    return null;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

}
