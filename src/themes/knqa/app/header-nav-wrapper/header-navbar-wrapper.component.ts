import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { ThemedHeaderComponent } from '../../../../app/header/themed-header.component';
import { HeaderNavbarWrapperComponent as BaseComponent } from '../../../../app/header-nav-wrapper/header-navbar-wrapper.component';
import { ThemedNavbarComponent } from '../../../../app/navbar/themed-navbar.component';
import { slideMobileNav } from '../../../../app/shared/animations/slide';

/**
 * Wrapper for the KNQA header and the (mobile) collapsible navbar.
 * Sticky at the top of the viewport with a 1px divider (Stitch "sticky navigation").
 */
@Component({
  selector: 'ds-themed-header-navbar-wrapper',
  styleUrls: ['header-navbar-wrapper.component.scss'],
  templateUrl: 'header-navbar-wrapper.component.html',
  imports: [
    AsyncPipe,
    ThemedHeaderComponent,
    ThemedNavbarComponent,
    TranslateModule,
  ],
  animations: [slideMobileNav],
})
export class HeaderNavbarWrapperComponent extends BaseComponent {
}
