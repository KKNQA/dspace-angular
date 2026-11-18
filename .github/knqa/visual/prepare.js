// KNQA CI: discover pages to screenshot in the running CI backend and create one draft
// submission to photograph. Writes a JSON page list.
// Usage: node prepare.js <out.json>
const fs = require('fs');

const API = 'http://127.0.0.1:8080/server/api';
const ADMIN = process.env.KNQA_CI_ADMIN || 'dspacedemo+admin@gmail.com'; // DSpace demo data account
const PASSWORD = process.env.KNQA_CI_PASSWORD || 'dspace';
const SUBMIT_COLLECTION = process.env.KNQA_CI_SUBMIT_COLLECTION || '9d8334e9-25d3-4a67-9cea-3dffdef80144';

const getJson = async (path, headers = {}) => {
  const r = await fetch(API + path, { headers });
  if (!r.ok) { throw new Error(`${path}: HTTP ${r.status}`); }
  return r.json();
};
const entityType = (o) => (o.metadata['dspace.entity.type'] || [{}])[0].value;

(async () => {
  const community = (await getJson('/core/communities/search/top?size=1'))._embedded.communities[0];
  const collection = (await getJson('/core/collections?size=1'))._embedded.collections[0];
  const items = (await getJson('/discover/search/objects?dsoType=ITEM&size=100'))
    ._embedded.searchResult._embedded.objects.map((o) => o._embedded.indexableObject);
  const untyped = items.find((o) => !entityType(o));
  const publication = items.find((o) => entityType(o) === 'Publication');

  // REST login (CSRF token + cookie, then credentials)
  const csrf = await fetch(`${API}/security/csrf`);
  let token = csrf.headers.get('dspace-xsrf-token');
  const cookie = () => `DSPACE-XSRF-COOKIE=${token}`;
  const login = await fetch(`${API}/authn/login`, {
    method: 'POST',
    headers: { 'X-XSRF-TOKEN': token, Cookie: cookie(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ user: ADMIN, password: PASSWORD }),
  });
  if (!login.ok) { throw new Error(`login: HTTP ${login.status}`); }
  const auth = login.headers.get('authorization');
  token = login.headers.get('dspace-xsrf-token') || token;
  const ws = await fetch(`${API}/submission/workspaceitems?owningCollection=${SUBMIT_COLLECTION}`, {
    method: 'POST',
    headers: { Authorization: auth, 'X-XSRF-TOKEN': token, Cookie: cookie(), 'Content-Type': 'application/json' },
  });
  if (!ws.ok) { throw new Error(`workspace item: HTTP ${ws.status}`); }
  const workspaceItem = (await ws.json()).id;

  const pub = [
    ['home', '/'],
    ['community-list', '/community-list'],
    ['community', `/communities/${community.uuid}`],
    ['collection', `/collections/${collection.uuid}`],
    ['search', '/search'],
    ['browse-title', '/browse/title'],
    ['login', '/login'],
  ];
  if (untyped) { pub.push(['item', `/items/${untyped.uuid}`], ['item-full', `/items/${untyped.uuid}/full`]); }
  if (publication) { pub.push(['publication', `/entities/publication/${publication.uuid}`]); }
  const authed = [
    ['mydspace', '/mydspace'],
    ['submission', `/workspaceitems/${workspaceItem}/edit`],
    ['admin-search', '/admin/search'],
    ['epeople', '/access-control/epeople'],
  ];
  const out = { admin: ADMIN, password: PASSWORD, public: pub, authed };
  fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
  console.log(`${pub.length + authed.length} pages; untyped item: ${!!untyped}; publication: ${!!publication}; workspace item ${workspaceItem}`);
})().catch((e) => { console.error(e); process.exit(1); });
