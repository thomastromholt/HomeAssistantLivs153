# HomeAssistant Livs153

AI-assisted Home Assistant configuration for Raspberry Pi 4 (8GB).  
Managed and deployed via Claude Code in VS Code over Tailscale SSH.

---

## Hardware

| Device | Role |
|--------|------|
| Raspberry Pi 4 (8GB) | HAOS host, Zigbee coordinator, Bluetooth hub |
| Zigbee USB dongle | Coordinator for climate sensors |
| 10× Zigbee temp/humidity sensors | Room-by-room climate monitoring |
| Eve Room (Bluetooth) | Indoor air quality — temp, humidity, VOC |
| SaveEye Pulse | Real-time household power monitoring |

**Planned (not yet integrated):**
- Zaptec EV charger
- Ngenic smart heating
- Pax Bluetooth extractor fans

---

## Integrations

| Integration | Source | What it provides |
|-------------|--------|-----------------|
| Zigbee (ZHA) | Built-in | 10× climate sensors |
| Bluetooth | Built-in | Eve Room, Pax fans |
| Nord Pool | HACS | Hourly spot prices, SE3, SEK/kWh |
| Greenely | HACS | Real-time consumption, daily/monthly cost |
| SaveEye | HACS | Live household load (W), daily kWh |
| Tailscale | HAOS Add-on | Always-on remote access + SSH |

---

## Project Files

```
HomeAssistantLivs153/
├── README.md                  — this file
├── .claudeignore              — files never sent to external AI services
├── remote_dashboard.yaml      — Lovelace UI for 10" wall tablet
├── smart_energy_logic.yaml    — HA automations
└── remote_access_setup.md     — Tailscale, SSH, HACS install guide
```

### [remote_dashboard.yaml](remote_dashboard.yaml)

Lovelace dashboard optimised for a 10-inch wall-mounted tablet.  
4-column grid layout with large touch targets.

| Section | Cards |
|---------|-------|
| Row 1 | SaveEye live power graph · Greenely cost today |
| Row 2 | Nord Pool today (bar + avg line) · Nord Pool tomorrow |
| Row 3 | Greenely monthly kWh + cost summary · Daily bar chart |
| Row 4 | Eve Room air quality gauge · temp/humidity |
| Row 5 | Zigbee temperature chips · 6h trend graph |
| Row 6 | Humidity for all rooms inc. Eve Room |
| Row 7 | Pax fan controls + humidity readouts |

**Required HACS frontend cards:**
- `apexcharts-card`
- `mini-graph-card`
- `mushroom`
- `lovelace-layout-card` (for `custom:grid-layout`)

### [smart_energy_logic.yaml](smart_energy_logic.yaml)

| Automation | Trigger | Logic |
|------------|---------|-------|
| Eve Room air alert | VOC > 1100 ppb for 5 min | Push notification to mobile |
| High load warning | SaveEye > max_kw for 5 min | Push notification with current price |
| Daily briefing | 07:00 | Nord Pool avg/min/max, 3 cheapest hours |

**Helpers required** (create in Settings → Devices → Helpers):

| Helper | Type | Example value |
|--------|------|---------------|
| `input_number.cheap_price_threshold` | Number | `0.80` SEK/kWh |
| `input_number.max_household_load_kw` | Number | `8.0` kW |

---

## Key Entity IDs

These are the expected entity IDs. **Verify all of them** in  
Developer Tools → States after installing each integration.

| Sensor | Entity ID |
|--------|-----------|
| Nord Pool current price | `sensor.nordpool_kwh_se3_sek_3_10_0` |
| Nord Pool today/tomorrow | attribute `today` / `tomorrow` on above |
| Greenely current price | `sensor.greenely_current_price` |
| Greenely monthly kWh | `sensor.greenely_month` |
| Greenely monthly cost | attribute `cost` on `sensor.greenely_month` |
| Greenely daily breakdown | attribute `daily_usages[]` on `sensor.greenely_month` |
| Greenely today kWh | `sensor.greenely_today` |
| SaveEye live power | `sensor.saveeye_current_power` |
| SaveEye today kWh | `sensor.saveeye_energy_today` |
| Eve Room temperature | `sensor.eve_room_temperature` |
| Eve Room humidity | `sensor.eve_room_humidity` |
| Eve Room VOC | `sensor.eve_room_voc` |
| Pax bathroom fan | `fan.pax_bathroom` |
| Pax basement fan | `fan.pax_basement` |

---

## Deployment

All files are deployed from VS Code via SSH over Tailscale.  
See [remote_access_setup.md](remote_access_setup.md) for first-time setup.

### Push a config update

```bash
# Copy files to HA config directory
scp remote_dashboard.yaml ha:/config/
scp smart_energy_logic.yaml ha:/config/

# Reload without restarting HA
ssh ha "ha lovelace reload"
ssh ha "ha automation reload"
```

### Stream live logs

```bash
ssh ha "ha core logs --follow"
```

### SSH alias

`ha` is defined in `~/.ssh/config` — points to `rpi.local` on the local network.
After Tailscale is set up, update `HostName` in `~/.ssh/config` to the MagicDNS hostname.

---

## Nord Pool price area

**SE3** (Stockholm / central Sweden).  
Adjust `region: "SE3"` in `configuration.yaml` if different.

---

## Security

`.claudeignore` prevents these from being read by AI tooling:

```
secrets.yaml      — credentials, tokens, API keys
*.db              — HA state/history databases
.storage/         — tokens, entity registry, auth data
ssl/              — TLS certificates and keys
*.log             — log files (contain IPs, entity states)
backups/          — full HA snapshots
```

Never commit `secrets.yaml` to version control.
