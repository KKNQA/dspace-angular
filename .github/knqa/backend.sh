#!/usr/bin/env bash
# KNQA CI: start a throwaway DSpace backend (with DSpace's demo data) whose version
# matches the UI checkout given as $1 (taken from its package.json, e.g. 9.4.0 -> dspace-9.4).
#
# $2 is the side ("before" or "after"). The backend also gets KNQA's own configuration
# (submission forms, document-type vocabulary, OAI crosswalk) from KKNQA/DSpace:
#   - "after": the KKNQA/DSpace branch with the same name as this branch, if there is one,
#     otherwise knqa-backend. So a frontend branch and a backend branch with the same name
#     are tested together.
#   - "before": knqa-backend.
# The KNQA files are only used when their DSpace version matches the backend image.
# Reuses the running backend when the version and the KNQA config are unchanged.
set -euo pipefail

UI_DIR=$(cd "$1" && pwd)
SIDE=${2:-after}
HERE=$(cd "$(dirname "$0")" && pwd)
MM=$(node -p "require('$UI_DIR/package.json').version.split('.').slice(0, 2).join('.')")
export DSPACE_VER="dspace-$MM"
export DOCKER_REGISTRY=docker.io
export COMPOSE_PROJECT_NAME=knqaci
STATE="$RUNNER_TEMP/knqa-backend-version"
KNQA_REPO=https://github.com/KKNQA/DSpace
RAW=https://raw.githubusercontent.com/KKNQA/DSpace

# Which KKNQA/DSpace branch supplies the KNQA config
BRANCH=${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}
REF=knqa-backend
if [[ "$SIDE" == after && -n "$BRANCH" && "$BRANCH" != knqa-theme ]] \
   && git ls-remote --exit-code --heads "$KNQA_REPO" "$BRANCH" > /dev/null 2>&1; then
  REF=$BRANCH
fi
FULL_SHA=$(git ls-remote "$KNQA_REPO" "refs/heads/$REF" | cut -f1)
SHA=${FULL_SHA:0:10}

# Fetch the KNQA config files at that commit (only if the backend's DSpace version matches)
CFG="$RUNNER_TEMP/knqa-config-$SHA"
OVERRIDE="$RUNNER_TEMP/knqa-config-$SHA.yml"
KNQA_FILES=(submission-forms.xml controlled-vocabularies/knqa_types.xml crosswalks/oai/metadataFormats/oai_openaire.xsl)
if [[ ! -f "$OVERRIDE" ]]; then
  BACKEND_MM=$(curl -sf "$RAW/$FULL_SHA/pom.xml" | grep -m1 -oE '<version>[0-9]+\.[0-9]+' | cut -d'>' -f2 || true)
  {
    echo "services:"
    echo "  dspace:"
    echo "    volumes:"
    echo "    - assetstore:/dspace/assetstore"
    if [[ "$BACKEND_MM" == "$MM" ]]; then
      for f in "${KNQA_FILES[@]}"; do
        mkdir -p "$CFG/$(dirname "$f")"
        if curl -sf "$RAW/$FULL_SHA/dspace/config/$f" -o "$CFG/$f"; then
          echo "    - $CFG/$f:/dspace/config/$f:ro"
        fi
      done
    fi
  } > "$OVERRIDE"
  [[ "$BACKEND_MM" == "$MM" ]] || echo "::notice title=KNQA backend config::$REF is DSpace ${BACKEND_MM:-?}, backend image is $MM: using stock DSpace config"
fi
KEY="$DSPACE_VER $REF@$SHA"
echo "KNQA backend config ($SIDE): $REF@$SHA"; grep ':ro' "$OVERRIDE" | sed 's/^ *- /  mounted: /' || true

if [[ -f "$STATE" && "$(cat "$STATE")" == "$KEY" ]]; then
  echo "Backend $KEY already running"
  exit 0
fi

echo "Starting backend $KEY"
docker compose -p "$COMPOSE_PROJECT_NAME" down -v --remove-orphans || true
docker compose -f "$UI_DIR/docker/docker-compose-ci.yml" -f "$HERE/docker-compose.knqa-ci.yml" -f "$OVERRIDE" up -d

printf 'Waiting for REST API'
for _ in $(seq 1 120); do
  if curl -sf http://127.0.0.1:8080/server/api/core/sites > /dev/null; then break; fi
  printf '.'; sleep 5
done
echo
curl -sf http://127.0.0.1:8080/server/api > /dev/null || { docker compose -p "$COMPOSE_PROJECT_NAME" logs --tail=200 dspace; exit 1; }

# Demo files, search index, OAI (same as upstream CI)
docker compose -f "$UI_DIR/docker/cli.yml" -f "$UI_DIR/docker/cli.assetstore.yml" run --rm dspace-cli

echo "$KEY" > "$STATE"
curl -s http://127.0.0.1:8080/server/api | grep -E '"dspace(Version|Name)"'
if curl -sf "http://127.0.0.1:8080/server/api/submission/vocabularies/knqa_types" > /dev/null; then
  echo "KNQA document-type vocabulary loaded"
fi
