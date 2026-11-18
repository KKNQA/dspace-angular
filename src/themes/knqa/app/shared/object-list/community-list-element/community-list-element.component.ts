import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Community } from '../../../../../../app/core/shared/community.model';
import { Context } from '../../../../../../app/core/shared/context.model';
import { ViewMode } from '../../../../../../app/core/shared/view-mode.model';
import { listableObjectComponent } from '../../../../../../app/shared/object-collection/shared/listable-object/listable-object.decorator';
import { CommunityListElementComponent as BaseComponent } from '../../../../../../app/shared/object-list/community-list-element/community-list-element.component';

/**
 * Keyword → Font Awesome icon mapping for the KNQA "Knowledge Areas"
 * (top-level communities). Matched case-insensitively against the community
 * name; first match wins, falling back to a generic folder icon.
 */
const KNOWLEDGE_AREA_ICONS: [RegExp, string][] = [
  [/research|publication/i, 'fa-book-open'],
  [/legal|regulatory/i, 'fa-scale-balanced'],
  [/corporate/i, 'fa-landmark'],
  [/qualification/i, 'fa-graduation-cap'],
  [/standard|guideline/i, 'fa-list-check'],
  [/department/i, 'fa-folder-tree'],
  [/multimedia|media/i, 'fa-photo-film'],
  [/histor|archive/i, 'fa-box-archive'],
];

const DEFAULT_ICON = 'fa-folder-open';

/**
 * KNQA community list element: knowledge-area icon in a tinted square,
 * name, item-count pill and short description.
 */
@Component({
  selector: 'ds-community-list-element',
  styleUrls: ['./community-list-element.component.scss'],
  templateUrl: './community-list-element.component.html',
  imports: [
    RouterLink,
  ],
})
@listableObjectComponent(Community, ViewMode.ListElement, Context.Any, 'knqa')
export class CommunityListElementComponent extends BaseComponent {

  get knowledgeAreaIcon(): string {
    const name = this.dsoNameService.getName(this.object) ?? '';
    const match = KNOWLEDGE_AREA_ICONS.find(([pattern]) => pattern.test(name));
    return match ? match[1] : DEFAULT_ICON;
  }
}
