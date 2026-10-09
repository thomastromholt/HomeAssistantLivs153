# Livlandsgatan 153 — Home Assistant

HA runs on an Intel NUC at `192.168.1.77` (port 80). SSH: `ssh root@192.168.1.77`.

## Applying changes

- **After any change on the HA box, run `ssh root@192.168.1.77 'ha core restart'`.** Do not ask the user to reboot or reload.
  - Dashboards (`/config/.storage/lovelace.*`) and the entity registry are held in memory; edits only apply after a core restart.
  - The browser reconnects by itself after ~20s and shows the fresh UI.
- Don't use the REST API restart with a hand-typed token. If the API is needed, read `HOMEASSISTANT_TOKEN` from `.env`.
- Back up a `.storage` file before editing it (`cp F F.bak`), and validate JSON with `jq` (available on the box).

## Custom HTML cards (`/config/www/` → `/local/`)

- HA serves `/local/` with a 31-day cache. Bump the `?v=N` query in the iframe URL whenever the HTML changes.
- Size iframe cards in the sections dashboard with `grid_options: {columns: "full", rows: N}`, not `aspect_ratio`.
- HTML should fill its frame (`height: 100%` / flex), not use fixed pixel heights.
- Keep local copies in this repo in sync with `/config/www/` (edit locally, then `scp`).

## Verifying a card visually

After each iteration of a custom HTML card, render it headless and read the result instead of asking the user:
`cd tools && npm i puppeteer-core && node shot.js ../.env "http://192.168.1.77/local/elpris-24h.html?mode=total" out.png`
It logs in with the `.env` token, prints console errors, the page's error box and stats, and saves a screenshot to look at.
