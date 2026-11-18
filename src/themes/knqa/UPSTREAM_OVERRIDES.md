# KNQA theme: upstream components it replaces

The `knqa` theme copies a handful of DSpace templates and changes them. DSpace fixes to
those base files (accessibility, new menu items, new metadata fields, bug fixes) do **not**
reach the KNQA UI automatically. On every upgrade, check what upstream changed in them
and port the relevant parts by hand.

Based on: **dspace-9.1**. Update this line after each upgrade.

| KNQA override (`src/themes/knqa/app/…`) | Upstream base (`src/app/…`) | What KNQA changed |
|---|---|---|
| `header/` | `header/` | White bar, logo, inline desktop navbar, search, "Log In" pill |
| `header-nav-wrapper/` | `header-nav-wrapper/` | Sticky header, mobile slide-down navbar |
| `navbar/` | `navbar/` | Menu markup and styling |
| `footer/` | `footer/` | 4-column KNQA footer and bottom bar |
| `home-page/` | `home-page/home-page.component.*` | Homepage layout and new sections |
| `home-page/home-news/` | `home-page/home-news/` | Hero, search, live statistics |
| `home-page/top-level-community-list/` | `home-page/top-level-community-list/` | "Browse Collections" card grid |
| `home-page/recent-item-list/` (subclass) | `home-page/recent-item-list/` | "Latest Deposits" timeline |
| `shared/object-list/community-list-element/` | `shared/object-list/community-list-element/` | Knowledge Area icons |
| `login-page/` | `login-page/` | KNQA lockup above the sign-in card |
| `item-page/simple/item-types/untyped-item/` | `item-page/simple/item-types/untyped-item/` | Document-details layout |
| `item-page/simple/item-types/publication/` | `item-page/simple/item-types/publication/` | Same layout plus relations |

Small skeleton overrides kept on purpose (removing them would change behaviour or styling):

| KNQA file (`src/themes/knqa/app/…`) | Why it stays |
|---|---|
| `community-list-page/community-list/` | Drops the base component's SCSS |
| `shared/object-collection/shared/badges/access-status-badge/` | Drops the base component's SCSS (badges are styled globally) |
| `shared/dso-selector/modal-wrappers/edit-item-selector/` | Template differs from the base |
| `shared/search/search-filters/`, `search-settings/`, `search-sidebar/` | Provide `SearchConfigurationService` the way the skeleton does |
| `shared/object-list/collection-list-element/`, `browse-entry-list-element/`, `search-result-list-element/…/item/`, `sidebar-search-list-element/…/publication/`, `entity-groups/…/journal`, `journal-issue`, `journal-volume`, `person` | Registered with `@listableObjectComponent(…, 'knqa')`. A theme registration ranks above DSpace's context-specific ones, so removing these changes which component renders (e.g. on the admin search and community pages; found by KNQA CI in Gate 3) |
| `community-page/sections/sub-com-col-section/*`, `shared/object-list/object-list.component.*` | No fade-in animation / default change detection, unlike the base. Kept to be safe |

Every other component uses the official DSpace version directly. Theme stubs that only
pointed at the base template were removed in Gate 3; do not re-add stubs from
`src/themes/custom` unless you change them.

New KNQA-only components (no upstream base, but they use DSpace services; a failing build
or wrong homepage numbers point here): `home-page/featured-publications/`,
`home-page/repository-insights/`, `home-page/top-collections/`.

Core files KNQA must edit (DSpace's documented theme registration):
`angular.json`, `src/themes/eager-themes.module.ts`, `config/config.yml`.
Generated core file: `src/assets/i18n/en.json5` (see `scripts/knqa-i18n.ts`).

## What upstream changed in the overridden components

```bash
OLD=dspace-9.1; NEW=dspace-9.4     # previous and new release tags
git diff $OLD $NEW --stat -- \
  src/app/header src/app/header-nav-wrapper src/app/navbar src/app/footer \
  src/app/home-page src/app/login-page src/app/shared/object-list/community-list-element \
  src/app/item-page/simple/item-types/untyped-item src/app/item-page/simple/item-types/publication
# How the official theme skeleton changed (stub imports, module lists):
git diff $OLD $NEW --stat -- src/themes/custom
```
