# HomeAssistant Livs153

Home Assistant for Livlandsgatan 153: dashboards, custom HTML cards and the notes behind them.
Managed with Claude Code over SSH.

## Setup

| Part | Details |
|------|---------|
| Host | Intel NUC (16 GB) running Home Assistant OS, `192.168.1.77` |
| Zigbee | ZHA, temperature/humidity sensors (Sonoff SNZB-02P) in the bedroom, toilet and living room |
| Air quality | Airthings Wave Plus (Bluetooth): radon, CO₂, VOC, temperature, humidity, pressure |
| EV | Kia Ceed PHEV (Kia Uvo integration), Zaptec Go2 and Stugan chargers |
| Prices | Nord Pool SE3 (15-minute), see [docs/elpriskalkulator.md](docs/elpriskalkulator.md) |
| Heating | NIBE EVP 270, no open interface. Peak shaving via the heat-curve offset is planned, see [docs/peak-shaving-rules.md](docs/peak-shaving-rules.md) |

## Layout

```
www/       the dashboard cards (HTML), shared card-dark.css / card-common.js, kia-car.png (not committed)
config/    HA YAML and a backup of the dashboard JSON (config/dashboards/)
docs/      notes: price formula, peak-shaving rules, remote access, AI assistant guide
tools/     deploy and headless-render scripts
```

## Dashboards

- **Livlandsgatan 153**: five cards (electricity price, Ceed, Zaptec, Radon, Temperatur) packed in one wide section.
- **Elpriser**: the electricity price and the Nord Pool spot price side by side.

The cards are plain HTML served from `/config/www` as `/local/...` and shown with iframe cards.
They read data through Home Assistant's own connection, and tapping a value opens HA's history pop-up.

## Deploy

```
tools/deploy.sh
```

Copies `www/` to the box, bumps the cache version on the card URLs, restarts HA Core and saves the dashboard JSON back into `config/dashboards/`.
Needs SSH access to the box (`ssh root@192.168.1.77`).

## Checking a card visually

```
cd tools && npm i puppeteer-core
node page.js ../.env "http://192.168.1.77/local/zaptec.html" out.png 372 440
node dash.js ../.env "http://192.168.1.77/livlandsgatan-153/home" dash.png 1500 900
```

`.env` holds `HOMEASSISTANT_URL` and `HOMEASSISTANT_TOKEN` (a long-lived token) and is never committed.
