#!/usr/bin/env bash
# Deploy the automations to the box:
#   tools/deploy_automations.sh
#   HA_SSH_HOST=root@<tailscale-name> tools/deploy_automations.sh   (away from home)
# /config/automations.yaml is built from the files below, in this order (there are no UI-made automations). Each id must
# be there exactly once. The config is checked before HA restarts, and the old file is put back if the check fails.
# config/automations/peak_shaving.yaml is not in use and not deployed.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST=${HA_SSH_HOST:-root@192.168.1.77}
FILES="room_plans firmware_updates load_balance charge_plan_control"

for f in $FILES; do cat "config/automations/$f.yaml"; echo; done \
  | ssh "$HOST" "cat > /tmp/automations.new.yaml"

ssh "$HOST" sh -s <<'REMOTE'
set -e
cd /config
cp automations.yaml automations.yaml.pre-deploy
cp /tmp/automations.new.yaml automations.yaml
dups=$(grep -o "^- id: .*" automations.yaml | sort | uniq -d)
if [ -n "$dups" ]; then
  echo "Duplicate ids: $dups"; cp automations.yaml.pre-deploy automations.yaml; exit 1
fi
if ! ha core check; then
  echo "Config check failed, restoring the old automations.yaml"
  cp automations.yaml.pre-deploy automations.yaml
  exit 1
fi
ha core restart
REMOTE
echo "Automations deployed. HA is restarting."
