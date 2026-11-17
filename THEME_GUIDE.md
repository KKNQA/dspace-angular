# KNQA Theme Guide

The KNQA theme lives entirely in `src/themes/knqa` and is activated by
`config/config.yml → themes: - name: knqa`. It follows the standard DSpace theming
architecture, so anything not overridden falls back to the base DSpace UI automatically.

## Color variables

Defined in `src/themes/knqa/styles/_theme_sass_variable_overrides.scss`:

| Variable | Value | Use |
|---|---|---|
| `$knqa-blue` (`$primary`) | `#00286E` | Navigation, primary buttons, headings, links |
| `$knqa-blue-dark` (`$dark`) | `#001543` | Hover states, bottom footer, admin sidebar |
| `$knqa-green` (`$success`) | `#276E35` | Success / verified / open-access states ONLY |
| `$knqa-gold` (`$warning`, `accent`) | `#D3993F` | Accents, highlights, pending states |
| `$knqa-gold-dark` | `#8A5A00` | AA-compliant gold for text on light backgrounds |
| `$knqa-surface` (`$light`) | `#F8F9FA` | Page background |
| `$knqa-surface-alt` | `#EFF4FF` | Tinted containers, hovers, table headers |
| `$knqa-divider` | `#E2E8F0` | Borders and dividers |
| `$knqa-text` | `#1A202C` | Headings/body text |
| `$knqa-text-muted` | `#444651` | Secondary text |

A custom Bootstrap semantic color `accent` (gold) is registered, so `btn-accent`,
`bg-accent`, `text-accent`, `badge` variants etc. are available.

DSpace-specific `--ds-*` CSS variables (header heights, footer bands, admin sidebar,
breadcrumbs, notifications…) are overridden in `_theme_css_variable_overrides.scss`.

**Contrast rules:** never place white text on gold; use `$knqa-gold-dark` for gold text on
light surfaces. Green is reserved for positive status — do not use it decoratively.

## Typography

**Public Sans** (U.S. Web Design System typeface, OFL/CC0), self-hosted in
`assets/fonts/` and declared in `_fonts.scss` (weights 400/500/600/700 + italic).
No CDN request is made at runtime.

Scale (Bootstrap variables): base 16px; h1 32px/700, h2 24px/700, h3 20px, h4 18px.
The homepage hero title uses 40px (28px on mobile). Labels/badges use 11–13px semibold
uppercase with slight letter-spacing.

## Assets & logos

`src/themes/knqa/assets/**` is copied to `dist/**/assets/knqa/**` at build time (standard
DSpace theme-asset pipeline — no config needed for new files).

- `images/knqa-logo-h120.png` — header/footer lockup (coat of arms + KNQA + full name)
- `images/knqa-logo-h300.png` — high-res variant (print/social/meta tags)
- `images/favicon-32|64|180.png` — favicon set (KNQA roundel), registered via
  `headTags` in `config/config.yml`

To swap the logo, replace these files (keep names) or update
`src/themes/knqa/app/header/header.component.html` and `footer.component.html`.

## Icons

DSpace's bundled **Font Awesome 6 Free** is used throughout. The Stitch mockups used
Material Symbols; equivalents were mapped (search, download, arrows, user…). Adding a second
icon font was rejected to keep payload small and upgrades simple.

Community cards show a **knowledge-area icon** chosen by keyword-matching the community
name (research → book-open, legal → scale-balanced, qualification → graduation-cap, …).
The mapping lives in
`app/shared/object-list/community-list-element/community-list-element.component.ts`
(`KNOWLEDGE_AREA_ICONS`) — see `REPOSITORY_STRUCTURE.md` for the full table and the
planned community/collection layout.

## Component overrides

Overrides live under `src/themes/knqa/app/**` and extend the base component class. Two styles:

1. **Full override** (own template/SCSS): header, header-nav-wrapper, navbar, footer,
   home-page, home-news (hero + stats), top-level-community-list, untyped-item, publication.
2. **Stub override** (base template + theme CSS): everything else from the skeleton.

The homepage also adds theme-only components with no base equivalent, under
`src/themes/knqa/app/home-page/`: `recent-item-list` (Latest Deposits timeline),
`featured-publications`, `repository-insights` and `top-collections`. They are plain
standalone components imported by the themed `home-page` component, so they need no
registration anywhere in core.

To customize another component: find its stub under `src/themes/knqa/app/...`, copy the base
template next to it, change `templateUrl`/`styleUrls` in the stub from the `../../../../app/...`
paths to `./...`, and edit. Entry components (with `@listableObjectComponent`) must pass
`'knqa'` as the decorator's theme argument.

## Global styling

`styles/_global-styles.scss` implements the design language against stable DSpace selectors:
buttons, cards, pill badges (type/access-status), forms, tables, pagination, breadcrumbs,
facet sidebar, search-result cards (`ds-object-list … li` becomes an elevated card),
item-page metadata tiles (`.simple-view-element`), login card, submission wizard, MyDSpace
status tints, admin sidebar, alerts, skeletons and nav-tabs. Prefer adding rules here (or in
an override's SCSS) rather than editing base styles.

## Future customization checklist

- **Colors/typography** → `_theme_sass_variable_overrides.scss`
- **DSpace chrome (header heights, sidebar colors…)** → `_theme_css_variable_overrides.scss`
- **Component look** → `_global-styles.scss` (CSS-only) or a component override (structure)
- **Labels** → add keys to `src/assets/i18n/en.json5` (keep the `knqa.` prefix pattern)
- **New pages/menu items** → standard DSpace configuration (menus come from MenuService)
- **Upgrading DSpace** → merge upstream; conflicts are only possible in the four registered
  core files (angular.json, eager-themes.module.ts, config.yml, en.json5) — all trivial.
  After upgrading, diff `src/themes/custom` against `src/themes/knqa` stubs for new
  skeleton components worth copying.

## Deviations from the Stitch design (and why)

| Stitch element | Status | Reason |
|---|---|---|
| "Trending:" quick links under hero search | Omitted | DSpace has no trending-searches API; would require backend statistics work |
| Homepage "Featured Publications" curated cards | Implemented; "featured" defaults to the most recently *issued* items | DSpace has no featured flag. Set `FEATURED_QUERY` in `featured-publications.component.ts` to a Discovery query (e.g. a shared `dc.subject` value) to curate the section by hand |
| Featured card cover images | Item thumbnail, else a branded gradient panel | The Stitch covers are stock placeholders; metadata-only records have no thumbnail to show |
| Repository Insights "Downloads" tile | Shows the **collection** count instead | DSpace exposes usage statistics per object only — `{uuid}_TotalDownloads` 404s at site and community scope, so there is no site-wide download total to read |
| Featured card download counters | Live per-item `TotalDownloads`, hidden when unavailable | Accurate, but stays hidden until items have files and usage has accrued |
| Homepage "Latest Deposits" alternating timeline | Implemented as the Stitch alternating timeline | Built as a themed component rather than restyling the shared list component |
| Browse-category icon set per collection type | Generic community cards | DSpace communities are user-defined; no type→icon mapping exists in metadata |
| Item page "Version History" rail | Native DSpace version history (item-page section) kept | Same information, different placement; rail duplication would desync from core behavior |
| Item page "OFFICIAL" badge, per-document keywords pills | Subjects shown as text field | Would require metadata conventions (e.g. `knqa.status`) agreed with the Authority first |
| Upload wizard 4-step circles | DSpace submission sections restyled as cards | The submission engine is config-driven; replacing its chrome would break upgradeability |
| Approval queue table with inline approve/reject icons | MyDSpace workflow cards restyled | The claimed-task actions are functionally identical; the table layout would require replacing the whole MyDSpace results engine |
| Admin dashboard charts (upload trends, service status) | Native admin + statistics pages restyled (navy sidebar) | Live charts need usage-report aggregation endpoints not present in core |
| Material Symbols icons | Font Awesome equivalents | Avoid double icon-font payload; FA ships with DSpace |
| Header search as full inline field | Expandable search icon (restyled) | Preserves DSpace's accessible expandable search; inline field would crowd the nav on smaller desktops |

Each of these can be revisited later — most become straightforward once the corresponding
backend capability (statistics aggregation, curated collections, metadata conventions) exists.
