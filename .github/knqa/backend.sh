#!/usr/bin/env bash
# KNQA CI: start a throwaway DSpace backend (with DSpace's demo data) whose version
# matches the UI checkout given as $1 (taken from its package.json, e.g. 9.1.0 -> dspace-9.1).
# Reuses the running backend when the version is unchanged.
set -euo pipefail

UI_DIR=$(cd "$1" && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)
MM=$(node -p "require('$UI_DIR/package.json').version.split('.').slice(0, 2).join('.')")
export DSPACE_VER="dspace-$MM"
export DOCKER_REGISTRY=docker.io
export COMPOSE_PROJECT_NAME=knqaci
STATE="$RUNNER_TEMP/knqa-backend-version"

if [[ -f "$STATE" && "$(cat "$STATE")" == "$DSPACE_VER" ]]; then
  echo "Backend $DSPACE_VER already running"
  exit 0
fi

echo "Starting backend $DSPACE_VER"
docker compose -p "$COMPOSE_PROJECT_NAME" down -v --remove-orphans || true
docker compose -f "$UI_DIR/docker/docker-compose-ci.yml" -f "$HERE/docker-compose.knqa-ci.yml" up -d

printf 'Waiting for REST API'
for _ in $(seq 1 120); do
  if curl -sf http://127.0.0.1:8080/server/api/core/sites > /dev/null; then break; fi
  printf '.'; sleep 5
done
echo
curl -sf http://127.0.0.1:8080/server/api > /dev/null || { docker compose -p "$COMPOSE_PROJECT_NAME" logs --tail=200 dspace; exit 1; }

# Demo files, search index, OAI (same as upstream CI)
docker compose -f "$UI_DIR/docker/cli.yml" -f "$UI_DIR/docker/cli.assetstore.yml" run --rm dspace-cli

echo "$DSPACE_VER" > "$STATE"
curl -s http://127.0.0.1:8080/server/api | grep -E '"dspace(Version|Name)"'
