# KNQA White-Label — Implementation Log

Project: white-label DSpace 9.1 (dspace-angular) as the **KNQA Digital Repository**,
based on the Google Stitch designs in `../stitch-design/` (see `../DESIGN_ANALYSIS.md`).

Backend: DSpace 9.1 (`../dspace-backend`, unmodified — UI-only project).
Branch: `knqa-theme` (based on tag `dspace-9.1`).

## Approach

All customization is implemented as a self-contained Angular theme in `src/themes/knqa`
(copied from the officially supported `src/themes/custom` skeleton). DSpace resolves themed
components by folder-name convention and loads the theme CSS bundle at runtime, so the theme
needs only three small core-file registrations (below). This keeps the installation
upgradeable: future DSpace releases merge cleanly because core code is untouched.

## Core files modified (the complete list)

| File | Change | Why |
|---|---|---|
| `angular.json` | Added `knqa-theme` style bundle entry (`src/themes/knqa/styles/theme.scss`) | Required registration for a theme's CSS bundle |
| `src/themes/eager-themes.module.ts` | Import + register `KnqaEagerThemeModule` | Required so header/footer/entry components load eagerly |
| `config/config.yml` | `themes: - name: knqa` + favicon headTags | Activates the theme for every route |
| `src/assets/i18n/en.json5` | **Additive** `footer.knqa.*` / `home.knqa.*` keys, plus reworded `repository.title`, `repository.title.prefix`, `login.form.header`, logo alt-text keys | Labels for KNQA footer/hero and white-labeled site title / login heading (standard DSpace label customization) |

Everything else lives in `src/themes/knqa/**` (new files, no upstream conflicts).

## Theme files created/modified in `src/themes/knqa`

### Styles (`styles/`)
- `_fonts.scss` — **new**: self-hosted Public Sans @font-face (assets/knqa/fonts)
- `_theme_sass_variable_overrides.scss` — KNQA palette (#00286E / #276E35 / #D3993F),
  Public Sans stack, type scale, radii (8/12px + pills), shadows, component variables,
  1280px container, `accent` semantic color
- `_theme_css_variable_overrides.scss` — `--ds-*` variables: white sticky header (72px),
  1px divider, footer bands, navy admin sidebar, notification/thumbnail/breadcrumb colors
- `_global-styles.scss` — the KNQA design language applied to stable DSpace selectors:
  buttons, cards, pill badges, forms, tables, pagination, breadcrumbs, facet sidebar,
  search-result cards, item-page metadata tiles, login card, submission wizard, MyDSpace
  status tints, admin polish, alerts, skeletons, nav-tabs
- `theme.scss` — added `_fonts.scss` import

### Assets (`assets/`)
- `fonts/PublicSans-{Regular,Medium,SemiBold,Bold,Italic}.woff2` (from public-sans v2.001, OFL/CC0)
- `images/knqa-logo-h120.png`, `images/knqa-logo-h300.png` (resized from supplied logo)
- `images/favicon-{32,64,180}.png` (KNQA roundel crop)

### Component overrides (`app/`)
| Component | Kind | Notes |
|---|---|---|
| `header/` | Template + SCSS | White bar, KNQA logo, inline desktop navbar, search, navy "Log In" pill (modeled on the dspace theme header) |
| `header-nav-wrapper/` | Template + SCSS | Sticky positioning, 1px bottom divider, mobile slide-down navbar, menu-item styling |
| `navbar/` | Template | Menu sections rendered from MenuService (unchanged behavior) |
| `footer/` | Template + SCSS + TS | 4-column KNQA footer (brand blurb, quick links, legal, contact) + navy bottom bar with government + DSpace attribution; `showTopFooter = true` |
| `home-page/home-news/` | Template + SCSS + TS | Hero: two-line title (blue/gold), mission statement, large search form, live stats (items/communities/collections via SearchService + data services) |
| `home-page/` | Template + TS | Hero → browse-communities grid → recent submissions; discovery-filters variant preserved |
| `home-page/top-level-community-list/` | Template + SCSS + TS | "Browse Collections" heading + View All link; responsive card grid |
| `home-page/featured-publications/` | **New** | "Featured Publications" cards: cover art (item thumbnail, branded fallback), owning-collection pill, `dc.publisher` department line, issued date, download count (item `TotalDownloads` usage report) and a Download link to the first ORIGINAL-bundle file. Curate via `FEATURED_QUERY` |
| `home-page/repository-insights/` | **New** | Blue "Repository Insights" panel: total items, communities, collections, `dc.type:Article`, `dc.type:Report`, plus contributor count from the `author` browse index |
| `home-page/top-collections/` | **New** | "Top Collections" ranked list — item counts per collection (Discovery has no collection facet, so counts are gathered in parallel over the first `TOP_COLLECTIONS_SAMPLE_SIZE` collections) |
| `item-page/simple/item-types/untyped-item/` | Template + SCSS | Stitch document-details layout: main column (abstract, metadata tile grid, subjects, URI, collections) + right rail card (thumbnail, files, authors) |
| `item-page/simple/item-types/publication/` | Template + SCSS | Same layout incl. related-items relations |
| `login-page/` | Template + SCSS | KNQA lockup instead of the DSpace logo above the sign-in card |
| *(all other skeleton stubs)* | Unchanged | Point at base templates; restyled via theme SCSS only |

### Fixes during implementation
- Replaced theme name `'custom'` → `'knqa'` in all 11 `@listableObjectComponent` decorator files
  (copied from the skeleton; the decorator's 4th argument is the theme name).
- Avoided `[data-test]` attribute selectors in SCSS (not rendered during SSR).
- `npm ci` needs `--legacy-peer-deps` under npm 11 (lockfile predates stricter peer checks)
  and `CYPRESS_INSTALL_BINARY=0` on flaky networks.
- `--legacy-peer-deps` skips lockfile entries marked `"peer": true`, so `@popperjs/core`
  (ng-bootstrap peer) must be installed explicitly: `npm i @popperjs/core@2.11.8 --no-save --legacy-peer-deps`.
  (Not needed on the supported Node 18/20/22 + npm 10 toolchain.)
- Builds need `NODE_OPTIONS=--max_old_space_size=8192` (standard DSpace requirement; default
  Node heap OOMs).
- `@font-face` URLs in theme SCSS must be relative to the SCSS file
  (`url('../assets/fonts/…')`) so webpack emits the fonts; runtime-style `assets/knqa/…`
  paths don't resolve at build time.

## Preserved functionality
No repository concepts changed. Communities/Collections/Items, metadata, submission workflow,
search/discovery, browse, authentication, administration, permissions, statistics and the REST
API are untouched — only presentation-layer templates/styles were themed, and every functional
child component (`ds-*`) from the base templates was kept in the overrides.

## Accessibility
- Public Sans at 16px base; AA-checked text colors (#1A202C on white, #444651 secondary).
- Gold is only used for large display text via darkened `#8A5A00`, or as background with dark text.
- Global `:focus-visible` outline (2px, offset) added on top of DSpace's keyboard support.
- All ARIA attributes from base templates preserved in overrides; hero stats use `aria-live`.
- Screen-reader flow unchanged (same components, same roles/labels).

## Remaining work / known deviations
See “Deviations from the Stitch design” in `THEME_GUIDE.md`.

## Verification
- `npm run build` (development) — pass.
- Dev server (`npm run serve`, NODE_ENV=development) run against the `sandbox.dspace.org`
  REST backend; visually verified with headless-browser screenshots saved to
  `../screenshots/` (home, search, community-list, login): hero + live stats, facet
  sidebar + result cards, community list, and fully branded login all render correctly.
- Note for headless testing: the sandbox WAF returns 403 to headless browser user-agents —
  spoof a regular UA when screenshotting.
- `npm run build:prod` — recommended before deploy.
