# KNQA Digital Repository — Content Structure

The repository is organized into eight top-level communities ("**Knowledge Areas**").
Create these via *Admin → New → Community* on the production backend (or via the REST API).
Names must match the keywords below so the theme shows the right icon on the homepage
browse grid (matching is case-insensitive and keyword-based, so minor wording changes
are fine).

| Knowledge Area (community name) | Theme icon | Suggested collections |
|---|---|---|
| Research & Publications | book-open | Research Papers · Journal Articles · Conference Proceedings · Working Papers |
| Legal & Regulatory Documents | scale-balanced | Acts & Legal Notices · Regulations · Gazette Notices · Circulars |
| Corporate Documents | landmark | Strategic Plans · Annual Reports · Service Charters · Policies |
| Qualification Framework | graduation-cap | KNQF Levels & Descriptors · Framework Reviews · Alignment Reports |
| Standards & Guidelines | list-check | Accreditation Standards · Assessment Guidelines · RPL Guidelines · Quality Assurance Manuals |
| Departmental Resources | folder-tree | One collection per directorate/department |
| Multimedia | photo-film | Videos · Photo Archives · Audio Recordings · Conference Recordings |
| Historical Archives | box-archive | Legacy Publications · Superseded Frameworks · Historical Records |

## How the icons work

`src/themes/knqa/app/shared/object-list/community-list-element/community-list-element.component.ts`
maps community-name keywords to Font Awesome icons:

| Keyword match | Icon |
|---|---|
| research, publication | `fa-book-open` |
| legal, regulatory | `fa-scale-balanced` |
| corporate | `fa-landmark` |
| qualification | `fa-graduation-cap` |
| standard, guideline | `fa-list-check` |
| department | `fa-folder-tree` |
| multimedia, media | `fa-photo-film` |
| histor…, archive | `fa-box-archive` |
| *(anything else)* | `fa-folder-open` (default) |

To add or change a mapping, edit the `KNOWLEDGE_AREA_ICONS` table in that component —
one line per rule, first match wins.

## Notes for administrators

- Collection-level submission forms, workflows and permissions are configured on the
  backend as usual (`submission-forms.xml`, workflow config, resource policies) — the theme
  does not constrain them.
- The homepage "Browse Collections" grid shows **top-level communities** with their
  archived-item counts; sub-communities and collections appear on each community's page.
- Restrict "Historical Archives" or departmental collections with standard DSpace
  resource policies if they should not be publicly visible; access-status badges
  (Open Access / Restricted) are styled by the theme automatically.
