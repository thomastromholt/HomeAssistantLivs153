# AI Bot Integration Guide

**For Claude, Gemini, and other AI assistants working on this Home Assistant project.**

---

## TL;DR

**Use the Home Assistant MCP integration, not SSH.** The MCP server is already configured and provides direct access to the live HA instance without shell commands.

---

## The Setup

### What is MCP?

**Model Context Protocol (MCP)** is a standardized way for AI assistants to interact with external systems. This project has an MCP server (`ha-mcp`) that runs as a bridge between Claude Code and the Home Assistant instance.

**Why MCP instead of SSH?**
- ✅ Direct API access to HA (faster, fewer errors)
- ✅ Structured responses (JSON, not text parsing)
- ✅ No file permission issues
- ✅ Real-time entity state queries
- ✅ Works with Tailscale VPN (no SSH tunnel needed)

**Why NOT SSH?**
- ❌ Port 22 is not exposed on HAOS SSH add-on
- ❌ Requires manual file parsing
- ❌ Shell commands can fail silently
- ❌ Slower than direct API calls

---

## Configuration

The MCP server is configured in `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "home-assistant": {
      "command": "/opt/homebrew/bin/uvx",
      "args": ["--python", "3.13", "--refresh", "ha-mcp@latest"],
      "env": {
        "HOMEASSISTANT_URL": "http://100.108.82.79:8123",
        "HOMEASSISTANT_TOKEN": "eyJhbGc..."
      }
    }
  }
}
```

**Key values:**
- `HOMEASSISTANT_URL`: Tailscale IP of the HA instance (100.108.82.79)
- `HOMEASSISTANT_TOKEN`: Long-lived access token (keep secret, never commit to git)

---

## Common MCP Commands

### Query Entity State

```python
ha_get_state(entity_id=["sensor.nordpool_kwh_se3_sek_3_10_025", "sensor.greenely_daily_usage"])
```

Returns current value + all attributes as structured JSON.

### Search for Entities

```python
ha_search_entities(domain_filter="sensor", query="temperature")
ha_search_entities(query="eve")  # Fuzzy search
```

Use this to find entity IDs before querying them.

### Get Device Info

```python
ha_get_device(integration="zha")  # List Zigbee devices
ha_get_integration(name="nordpool")  # Check if integration is loaded
```

### Update Dashboard

```python
ha_config_get_dashboard(url_path="remote-control")  # Fetch current config
ha_config_set_dashboard(url_path="remote-control", config_hash="...", python_transform="...")
```

The `config_hash` prevents race conditions. Always fetch the dashboard first to get the latest hash.

### Create/Update Helpers

```python
ha_config_set_helper(
  name="input_number.cheap_price_threshold",
  type="number",
  min=0,
  max=10,
  unit="SEK/kWh",
  value=0.80
)
```

Helpers are UI-configured automations that don't require YAML editing.

### Deploy Automations

```python
ha_config_set_automation(
  automation_id="eve_room_air_quality_alert",
  config={...}  # Full automation YAML as dict
)
```

### Call a Service

```python
ha_call_service(
  domain="light",
  service="turn_on",
  entity_id="light.living_room",
  brightness=100
)
```

### Check Logs

```python
ha_get_logs(source="error_log", limit=30)
```

Returns most recent log lines. Use this to debug config errors.

---

## Current Entity IDs (Verified 2026-06-05)

These exist and are actively used by the dashboard:

| Sensor | Entity ID |
|--------|-----------|
| Nord Pool current price | `sensor.nordpool_kwh_se3_sek_3_10_025` |
| Nord Pool 96 x 15-min intervals | attribute `raw_today` (array of `{start, end, value}`) |
| Nord Pool avg/min/max | attributes `average`, `min`, `max` |
| Greenely daily usage | `sensor.greenely_daily_usage` (attribute `data[]`) |
| Greenely prices | `sensor.greenely_prices` |
| Sonoff ZBDongle-E (Zigbee coordinator) | `sensor.sonoff_zbdongle_e_*` (network diagnostics) |

### Entities Not Yet Available

These are referenced in the dashboard YAML but don't exist yet (need pairing):

- `sensor.temp_living_room` (Zigbee — not paired)
- `sensor.temp_bedroom` (Zigbee — not paired)
- `sensor.humidity_living_room` (Zigbee — not paired)
- `sensor.eve_room_voc` (Bluetooth Eve Room — not paired)
- `sensor.eve_room_temperature` (Bluetooth Eve Room — not paired)
- `sensor.eve_room_humidity` (Bluetooth Eve Room — not paired)

---

## Best Practices

1. **Always search before querying:** Use `ha_search_entities()` to verify an entity exists before calling `ha_get_state()`.

2. **Fetch before update:** When modifying the dashboard, always fetch the current config with `ha_config_get_dashboard()` to get the latest `config_hash`.

3. **Use Python transforms:** For complex dashboard changes, pass a `python_transform` string to `ha_config_set_dashboard()` — it's more reliable than reconstructing the entire config.

4. **Batch operations:** Use `ha_bulk_control()` for multiple entity updates (faster than individual calls).

5. **Check integration status:** Before assuming an entity doesn't exist, verify the integration is loaded:
   ```python
   ha_get_integration(name="greenely")
   ```

6. **Handle missing entities gracefully:** If an entity doesn't exist, don't try SSH into the Pi. Instead:
   - Search for similar entity names
   - Check `ha_get_logs()` for errors
   - Verify the integration is installed/configured

---

## Troubleshooting

### "Entity not found"

```python
# Don't do this:
ssh ha "cat /config/automations.yaml | grep sensor"

# Do this instead:
ha_search_entities(query="temperature")
ha_search_entities(domain_filter="sensor")
```

### Dashboard shows "config error"

```python
# Fetch the dashboard
config = ha_config_get_dashboard(url_path="remote-control")

# Check the log
logs = ha_get_logs(source="error_log", limit=50)

# If it's a missing custom card, install via HACS:
ha_hacs_search("apexcharts-card")
ha_hacs_download(repo="RomRider/apexcharts-card")
```

### Integration not loaded

```python
# Check status
status = ha_get_integration(name="greenely")

# If not loaded, the integration needs to be installed in HA's UI first
# (can't be done via MCP)
```

### Token expired

If you get "Unauthorized" errors:
1. Go to Home Assistant UI → Settings → Users → "Automations" user
2. Click the three dots → Create long-lived access token
3. Update `HOMEASSISTANT_TOKEN` in `.claude/settings.local.json`

---

## Architecture Overview

```
Your Machine (Claude Code)
        ↓
   .claude/settings.local.json (MCP config)
        ↓
   ha-mcp server (Python bridge)
        ↓
   Tailscale VPN (encrypted tunnel)
        ↓
   Raspberry Pi 4 (100.108.82.79)
        ↓
   Home Assistant (http://100.108.82.79:8123)
        ↓
   Integrations: Nord Pool, Greenely, ZHA, Bluetooth
```

The MCP server runs locally and communicates with HA via the Tailscale VPN. No SSH involved.

---

## Files Modified by MCP

The MCP can read and write:

- **Dashboard configs** (`/config/lovelace/remote-control.json`)
- **Automations** (`/config/automations.yaml` or storage-mode)
- **Helpers** (`/config/.storage/helpers.json`)
- **Entity states** (via service calls)

It **cannot**:
- Delete or modify `configuration.yaml` directly
- Access `.storage/` raw files
- Restart Home Assistant (can reload components only)
- Install HACS packages (must be done via HA UI)

---

## Next Steps (For New AI Assistants)

1. **Read this file first** before asking the user anything
2. **Verify the setup** by calling `ha_get_overview()` — should return system info
3. **Search for entities** before assuming they don't exist
4. **Use MCP for everything** — no SSH unless explicitly told "use SSH" by the user
5. **Keep the token safe** — never log it, never commit it, never put it in code

---

**Questions?** Check the `.claude/settings.local.json` file or ask the user directly.
