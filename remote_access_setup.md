# Remote Access Setup — Always-On

Two layers: **Tailscale** for SSH + HA UI from anywhere, **Nabu Casa** optional
for mobile app push notifications and voice assistants.

---

## 1. Tailscale Add-on (HAOS) — primary remote access

### Install tonight via SSH

```bash
# After SSHing in via Tailscale on first connection:
ha addon install a0d7b954_tailscale
ha addon start a0d7b954_tailscale
```

Or via HA UI: **Settings → Add-ons → Add-on Store → search "Tailscale"**

### Authenticate

```bash
ha addon logs a0d7b954_tailscale
# Copy the login URL from the log, open it on any device, approve the Pi
```

### What you get

- RPi4 gets a stable Tailscale IP (e.g. `100.x.x.x`) and a MagicDNS hostname
  like `homeassistant.tail1234.ts.net`
- Reach the HA UI from any device with Tailscale installed:
  `http://homeassistant.tail1234.ts.net:8123`
- SSH also available on port 22 through the same address
- Works on mobile data, hotel WiFi, work networks — no port forwarding needed

### Install Tailscale on your devices

| Device | Install |
|--------|---------|
| Mac/Linux | `brew install tailscale` or tailscale.com/download |
| iPhone/Android | App Store / Play Store |
| Windows | tailscale.com/download |

### Make it survive reboots

```yaml
# In the Tailscale add-on config (Options tab in HA UI):
accept_routes: true
log_level: info
```

The add-on starts automatically with HAOS — no manual intervention needed.

---

## 2. SSH Add-on — terminal access from HA UI

Install **"Terminal & SSH" add-on** (official):

```
Settings → Add-ons → Terminal & SSH
```

- Gives you a browser-based terminal at `http://<tailscale-ip>:8123/hassio/ingress/...`
- Also opens SSH on port 22 (set a password or authorized key in its config)
- Use `ha core logs` here to stream `home-assistant.log` live

---

## 3. Nord Pool Integration — install order tonight

```bash
# 1. Install HACS if not present (one-time):
wget -O - https://get.hacs.xyz | bash -

# 2. Restart HA, then in UI:
#    HACS → Integrations → search "nordpool" → install

# 3. Add to configuration.yaml:
```

```yaml
sensor:
  - platform: nordpool
    region: "SE3"          # adjust to your price area
    currency: "SEK"
    price_type: kWh
    precision: 3
    price_in_cents: false
```

```bash
# 4. Restart HA, then verify entity in:
#    Developer Tools → States → filter "nordpool"
#    Note the exact entity ID and update smart_energy_logic.yaml if different
```

---

## 4. Eve Room BLE Integration

The RPi4's built-in Bluetooth handles this automatically in modern HAOS.

### Steps

1. **Enable Bluetooth integration** — should auto-discover if not already active:
   `Settings → Devices & Services → Add Integration → Bluetooth`

2. **Place Eve Room within BT range** of the Pi (ideally same room or adjacent).
   Eve Room v2/v3 broadcasts BLE advertisements passively — no pairing needed.

3. **HA auto-discovers it** within a few minutes. Accept the discovered device.
   Expected entities created:
   - `sensor.eve_room_temperature`
   - `sensor.eve_room_humidity`
   - `sensor.eve_room_voc` (volatile organic compounds, ppb)

4. **If not auto-discovered**, install via HACS:
   `HACS → Integrations → search "Passive BLE Monitor"` — has explicit Eve support.

### VOC thresholds for reference

| Level | ppb | Meaning |
|-------|-----|---------|
| Good | < 450 | Fresh air |
| Fair | 450–1000 | Acceptable |
| Poor | 1000–3000 | Ventilate |
| Bad | > 3000 | Immediate action |

---

## 5. Greenely Real-Time Energy

Greenely uses an unofficial API. Install via HACS:

```
HACS → Integrations → search "Greenely" → install
```

Then: `Settings → Devices & Services → Add Integration → Greenely`
Login with your Greenely account credentials.

Key entities it provides:
- `sensor.greenely_current_price` — live SEK/kWh
- `sensor.greenely_today_cost` — accumulated cost today
- `sensor.greenely_hourly_consumption` — kWh per hour

> Note: Greenely is a community integration — if it breaks after a Greenely app
> update, Nord Pool prices in `smart_energy_logic.yaml` keep all automations
> running independently.
