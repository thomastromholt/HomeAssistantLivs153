#!/usr/bin/env bash
# Deploy the dashboard cards to Home Assistant and restart HA Core.
#   tools/deploy.sh
# - copies www/ to /config/www (served as /local/)
# - stamps a fresh ?v= on the card URLs so browsers skip the 31-day cache
# - restarts HA Core (dashboards are held in memory)
# - saves the dashboard JSON back into config/dashboards/ so the repo mirrors the box
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=root@192.168.1.77
STAMP=$(date +%s)
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

cp www/* "$STAGE"/
sed -i '' -E "s/(card-dark\.css|card-common\.js)\?v=[0-9a-z]+/\1?v=$STAMP/g" "$STAGE"/*.html
scp -q "$STAGE"/* "$HOST":/config/www/

ssh "$HOST" "STAMP=$STAMP sh -s" <<'REMOTE'
set -e
cd /config/.storage
for f in lovelace.livlandsgatan-153 lovelace.el-priser; do
  cp "$f" "$f.bak"
  sed -i -E 's/(\.html\?[^"]*v=)[0-9a-z]+/\1'"$STAMP"'/g' "$f"
  jq empty "$f"
done
ha core restart
REMOTE

scp -q "$HOST":/config/.storage/lovelace.livlandsgatan-153 config/dashboards/livlandsgatan-153.json
scp -q "$HOST":/config/.storage/lovelace.el-priser config/dashboards/el-priser.json
scp -q "$HOST":/config/.storage/lovelace_dashboards config/dashboards/registry.json
echo "Deployed ($STAMP). HA is restarting; give it ~25 s."
