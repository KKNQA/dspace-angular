#!/usr/bin/env bash
# KNQA CI: serve one built UI checkout against a matching backend and screenshot it.
# Usage: run-side.sh <ui-dir with dist/> <outDir>
set -euo pipefail

UI_DIR=$(cd "$1" && pwd)
mkdir -p "$2"
OUT=$(cd "$2" && pwd)
HERE=$(cd "$(dirname "$0")" && pwd)

"$HERE/backend.sh" "$UI_DIR"
VER=$(cat "$RUNNER_TEMP/knqa-backend-version")

# One page list (and one draft submission) per backend, shared by both sides
PAGES="$RUNNER_TEMP/pages-$VER.json"
[[ -f "$PAGES" ]] || node "$HERE/visual/prepare.js" "$PAGES"

# Serve the production build (SSR). Runtime config: config/config.yml + DSPACE_* env vars.
( cd "$UI_DIR" && nohup node dist/server/main > "$OUT.ssr.log" 2>&1 & )
printf 'Waiting for UI'
for _ in $(seq 1 90); do
  if curl -sf -o /dev/null http://127.0.0.1:4000/home; then break; fi
  printf '.'; sleep 2
done
echo
curl -sf -o /dev/null http://127.0.0.1:4000/home || { tail -n 100 "$OUT.ssr.log"; exit 1; }

# SSR smoke test: the server-rendered homepage must carry the KNQA title
TITLE=$(curl -s http://127.0.0.1:4000/home | grep -oE '<title>[^<]*</title>' | head -1)
echo "SSR title: $TITLE"
[[ "$TITLE" == *KNQA* ]] || { echo "::error::Server-rendered title does not contain KNQA ($TITLE)"; SSR_FAILED=1; }

node "$HERE/visual/capture.js" "$PAGES" "$OUT" "$UI_DIR/src/assets/i18n/en.json5" || CAPTURE_FAILED=1

kill "$(lsof -t -i:4000)" 2>/dev/null || true
sleep 2
[[ -z "${SSR_FAILED:-}" && -z "${CAPTURE_FAILED:-}" ]]
