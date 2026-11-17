# KNQA Digital Repository

A white-labeled [DSpace 9.1](https://dspace.org) institutional repository for the
**Kenya National Qualifications Authority (KNQA)** — a centralized platform for the
preservation and dissemination of Kenya's national qualification standards, research
papers, and official government publications.

The user interface follows the Google Stitch designs in `stitch-design/`, implemented as a
self-contained DSpace Angular theme. **All DSpace functionality is preserved** — communities,
collections, items, metadata, submission workflow, search/discovery, authentication,
administration, permissions, statistics, and the REST API are untouched. Only the
presentation layer is customized, and the installation remains upgradeable to future
DSpace releases.

## Workspace layout

| Path | What it is |
|---|---|
| `dspace-angular/` | DSpace 9.1 Angular frontend, branch **`knqa-theme`** — all UI work lives here |
| `dspace-backend/` | DSpace 9.1 backend source (unmodified reference checkout) |
| `stitch-design/` | Extracted Google Stitch mockups (per-screen HTML + PNG + DESIGN.md) |
| `DESIGN_ANALYSIS.md` | Analysis of the Stitch design system and its mapping to DSpace |
| `screenshots/` | Headless-browser verification screenshots of the themed UI |
| `KNQA Logo - White Background.png` | Source logo artwork |

Key documents inside `dspace-angular/`:

- **`THEME_GUIDE.md`** — color variables, typography, assets, component overrides, how to
  customize further, and the list of deliberate deviations from the Stitch mockups.
- **`IMPLEMENTATION_LOG.md`** — every file changed and why, build gotchas, verification notes.
- **`REPOSITORY_STRUCTURE.md`** — the eight KNQA knowledge areas (top-level communities),
  suggested collections, and the community-icon mapping.

## Prerequisites

- **Node.js 20 or 22 LTS** recommended (Node 24 works with the workarounds below)
- npm 10+ (npm 11 works with the workarounds below)
- ~4 GB free RAM for builds

## Install

```powershell
cd dspace-angular
$env:CYPRESS_INSTALL_BINARY = "0"       # skip the Cypress binary (only needed for e2e tests)
npm ci --legacy-peer-deps
npm i @popperjs/core@2.11.8 --no-save --legacy-peer-deps
```

> **Why the extra step?** Under npm 11, `--legacy-peer-deps` skips lockfile entries marked
> `"peer": true`, which drops `@popperjs/core` (needed by ng-bootstrap). On the supported
> Node 20/22 + npm 10 toolchain a plain `npm ci` is sufficient.

## Run (development)

```powershell
cd dspace-angular
$env:NODE_OPTIONS = "--max_old_space_size=8192"   # required — default heap OOMs
npm run start:dev
```

Wait for `listening on localhost:4000` (first compile takes 5–10 minutes), then open
**http://localhost:4000**.

The frontend talks to the REST backend configured in `config/config.yml` — currently the
public DSpace sandbox (`sandbox.dspace.org`), which provides demo content.

> Always use `start:dev` (or `start:prod`), not a bare `npm run serve` — the start scripts
> set `NODE_ENV`, without which i18n labels render as raw keys.

## Run (production)

```powershell
cd dspace-angular
$env:NODE_OPTIONS = "--max_old_space_size=8192"
npm run start:prod    # = build:prod (SSR) + node dist/server/main
```

For a real deployment: run `npm run build:prod` once, then serve `node dist/server/main`
behind a process manager (e.g. PM2) and a reverse proxy (Apache/Nginx) with HTTPS.

## Pointing at the KNQA backend

Edit `dspace-angular/config/config.yml`:

```yaml
rest:
  ssl: true
  host: repository.knqa.go.ke   # your DSpace backend
  port: 443
  nameSpace: /server
```

The backend must list the UI's origin in its `rest.cors.allowed-origins` configuration and
set `dspace.ui.url` to the UI's public URL —
`dspace-backend/dspace/config/local.cfg.knqa-production.EXAMPLE` is a ready-made template.
Full backend installation (Java 17, Maven, PostgreSQL, Solr) follows the standard
[DSpace 9 installation guide](https://wiki.lyrasis.org/display/DSDOC9x/Installing+DSpace).

**Dev-mode note:** `dspace-angular/config/config.development.yaml` overrides the REST target
with `localhost:8080` whenever you run `npm run start:dev`, so the production host in
`config.yml` is only used by production builds.

## Run the backend locally (Docker)

The only prerequisite is [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/)
(`winget install Docker.DockerDesktop`, then launch it once and let it finish WSL2 setup).

```powershell
cd dspace-backend
docker compose pull                 # fetch prebuilt DSpace 9 images (backend, Postgres, Solr)
docker compose up -d                # start the stack; KNQA overrides apply automatically
```

`docker-compose.override.yml` (in the repo) configures the container as
"KNQA Digital Repository" with CORS open to `http://localhost:4000`.
First start takes a few minutes (database migrations); watch with `docker compose logs -f dspace`.
The backend is ready when **http://localhost:8080/server** responds.

Create the first administrator account:

```powershell
docker compose -f docker-compose-cli.yml run --rm dspace-cli create-administrator `
  -e admin@knqa.go.ke -f KNQA -l Administrator -p <choose-a-password> -c en
```

Then run the UI (`npm run start:dev` in `dspace-angular/`), log in at
http://localhost:4000, and create the eight Knowledge Area communities per
`REPOSITORY_STRUCTURE.md`. Stop the backend with `docker compose down`
(data persists in Docker volumes; `down -v` wipes it).

## Theming in one paragraph

The theme is `dspace-angular/src/themes/knqa`, activated by `themes: - name: knqa` in
`config/config.yml`. Brand palette: **Primary Blue `#00286E`**, **Primary Green `#276E35`**
(success/verified states only), **Accent Gold `#D3993F`**, with white/light-gray/dark-gray
neutrals and self-hosted **Public Sans**. Colors and typography live in
`styles/_theme_sass_variable_overrides.scss`; DSpace chrome variables in
`styles/_theme_css_variable_overrides.scss`; the global design language in
`styles/_global-styles.scss`; structural overrides (header, navbar, footer, homepage hero
with live stats, item pages, login page) under `app/`. Only four core files are modified
(angular.json, eager-themes.module.ts, config.yml, en.json5), keeping upstream upgrades
trivial — see `THEME_GUIDE.md` for the upgrade checklist.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build dies with "JavaScript heap out of memory" | Set `NODE_OPTIONS=--max_old_space_size=8192` |
| `npm ci` fails on peer dependency conflicts | Add `--legacy-peer-deps`, then install `@popperjs/core` as shown above |
| Cypress binary download fails during install | Set `CYPRESS_INSTALL_BINARY=0` |
| Every label shows as a raw key (`nav.login`, …) | You ran `npm run serve` without `NODE_ENV` — use `npm run start:dev` |
| "500 Service unavailable" on every page | The REST backend in `config/config.yml` is unreachable, or its CORS config doesn't allow this UI's origin |
| Headless-browser tests get 403 from sandbox.dspace.org | The sandbox WAF blocks headless user-agents — spoof a regular browser UA |
