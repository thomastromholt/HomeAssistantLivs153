# Livlandsgatan 153 — Home Assistant

HA runs on an Intel NUC at `192.168.1.77` (port 80). SSH: `ssh root@192.168.1.77`.

## Layout

`www/` cards (served as `/local/`), `config/` HA YAML + dashboard JSON backup, `docs/` notes, `tools/` scripts.
**Deploy cards with `tools/deploy.sh`**: it copies `www/`, stamps a fresh `?v=` on the card URLs, restarts HA Core and saves the dashboard JSON back into `config/dashboards/`.

## Applying changes

- **After any change on the HA box, run `ssh root@192.168.1.77 'ha core restart'`.** Do not ask the user to reboot or reload.
  - Dashboards (`/config/.storage/lovelace.*`) and the entity registry are held in memory; edits only apply after a core restart.
  - The browser reconnects by itself after ~20s and shows the fresh UI.
- Don't use the REST API restart with a hand-typed token. If the API is needed, read `HOMEASSISTANT_TOKEN` from `.env`.
- Back up a `.storage` file before editing it (`cp F F.bak`), and validate JSON with `jq` (available on the box).

## Custom HTML cards (`/config/www/` → `/local/`)

- HA serves `/local/` with a 31-day cache, so card URLs carry a `?v=` stamp; `tools/deploy.sh` refreshes it.
- Size iframe cards in the sections dashboard with `grid_options: {columns: "full", rows: N}`, not `aspect_ratio`.
- HTML should fill its frame (`height: 100%` / flex), not use fixed pixel heights.
- Edit cards in `www/`, then run `tools/deploy.sh` (it does the cache bump, so no manual `?v=` edits).

## Verifying a card visually

After each iteration of a custom HTML card, render it headless and read the result instead of asking the user:
`cd tools && npm i puppeteer-core && node page.js ../.env "http://192.168.1.77/local/elpris-24h.html?mode=total" out.png 372 440`
It logs in with the `.env` token, prints the page text and errors, and saves a screenshot to look at.

## Card conventions

- `card-dark.css` and `card-common.js` are shared by the dark cards (`kia-ceed`, `zaptec`, `airthings`, `temperatur`, `elpris-24h`).
- Cards talk to HA through `callApi()` in `card-common.js` (HA's own connection, so the login token never goes stale) and open history with `openHistory(entityId)`.
- The Livlandsgatan dashboard is one wide section (`column_span: 3`) of cards with `columns: 12` and `rows: N` so they pack without gaps.
- `tools/page.js` renders any card page headless at card size: `node page.js ../.env "<url>" out.png 372 440`; `tools/dash.js` renders a whole dashboard; `tools/click.js` clicks inside a card to test the history pop-up.
- `www/kia-car.png` is a car render cropped from the Kia app; it is not committed (gitignored).
