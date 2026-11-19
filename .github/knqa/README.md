# KNQA CI (GitHub Actions)

`.github/workflows/knqa-ci.yml` builds the KNQA UI and checks that a change keeps the KNQA
look. Everything KNQA-specific lives in this folder or in that workflow file; no upstream
DSpace file is modified, so upgrades merge cleanly.

## What one run does

1. **Build** the "before" and "after" commits in parallel (`npm ci`, `npm run build:prod`).
   The "after" build also runs `scripts/knqa-i18n.ts --check` (KNQA labels applied) and
   lint (informational only).
2. **Backend:** `backend.sh` starts a throwaway DSpace backend whose version matches each
   UI (`package.json` 9.1.0 → Docker images `dspace-9.1`). It loads DSpace's demo data and
   `docker-compose.knqa-ci.yml` (self-registration off). If the versions differ (an
   upgrade), each side gets its own matching backend.
   It also mounts KNQA's backend config from [KKNQA/DSpace](https://github.com/KKNQA/DSpace)
   (`submission-forms.xml`, the `knqa_types` document-type vocabulary, the OAI crosswalk):
   "before" uses branch `knqa-backend`; "after" uses the KKNQA/DSpace branch **with the same
   name as this branch** if one exists (otherwise `knqa-backend`). So a change that needs both
   repos is tested by pushing branches with the same name to both. The files are only used when
   their DSpace version matches the backend image.
   After the screenshots, typing "occup" in Describe → Type must offer "Occupational standard"
   (a warning, not a failure, if not).
3. **Screenshots:** `run-side.sh` serves each build with SSR and checks that the
   server-rendered title contains "KNQA". `visual/capture.js` photographs about 14 pages
   (home, Knowledge Areas, community, collection, item, search, browse, login, MyDSpace,
   submission form, admin) at 375 / 768 / 1280 / 1440 px, plus the header login dropdown.
4. **Checks on "after":** UI login works; no "New user? Register" link anywhere;
   untranslated labels are reported.
5. **Compare:** `visual/compare.js` diffs every screenshot pixel by pixel. The run summary
   lists the changed screenshots, and the `knqa-screenshots` artifact holds
   `before/`, `after/` and `diff/` images (red = changed pixels).

The demo data is not KNQA's content (the Knowledge Area icons fall back to the default
icon, etc.). The comparison is still valid because both sides use the same data.

## What is compared with what

| Trigger | Before | Fails on visual change? |
|---|---|---|
| Pull request into `knqa-theme` | PR base | Yes (> 0.2% of a screenshot) |
| Push to `knqa-theme` | previous tip | Yes |
| Push to `knqa/**` or `gate*/**` | where the branch left `knqa-theme` | Yes |
| Push to `upgrade/**` | where the branch left `knqa-theme` | No, reports only |
| Manual run (Actions → KNQA CI → Run workflow) | `base_ref` you enter | Your choice |

## Gate 3 (remove unchanged theme stubs)

Push the pruning branch as `gate3/prune-stubs` (or open a PR into `knqa-theme`). It must
build, and every screenshot must be identical to `knqa-theme`.

## Gate 4 (upgrade to a new DSpace release)

Merge the release tag on `upgrade/<version>` and push. The run builds the upgraded UI,
serves it against a backend of the new version, and shows every visual difference from
the current KNQA site, for review against the regression checklist.
