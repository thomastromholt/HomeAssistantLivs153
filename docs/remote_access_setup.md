# Remote access (NUC and dashboard)

Goal: reach the Intel NUC (SSH) and the Home Assistant dashboard, including the custom cards, from anywhere, and let Claude Code deploy from a laptop that is not on the home network.

**Plan: Tailscale first, Nabu Casa kept open in parallel (section 5).** A private WireGuard network between your own devices. No port forwarding, nothing on the public internet, free for personal use. The NUC joins it through the Tailscale add-on. Nothing below needs a cloud account at Nabu Casa. Do **not** use Tailscale Funnel or open a router port: that would put HA on the public internet.

The Mac already has the Tailscale app (`/Applications/Tailscale.app`, IP `<mac-tailscale-ip>` at the time of writing, currently switched off).
The NUC is not on the tailnet yet, so the first step has to be done **at home**: the NUC cannot be reached from outside until the add-on is running.

## 1. Install on the NUC (at home, once)

1. Settings → Add-ons → Add-on store → ⋮ → Repositories, add `https://github.com/hassio-addons/repository` (Home Assistant Community Add-ons) if it is not there.
2. Install **Tailscale**, turn on *Start on boot* and *Watchdog*, start it.
3. Open the add-on log, follow the login link, and approve the device with the same account as the Mac and the phone.
4. In the Tailscale admin console (login.tailscale.com), find the new machine (named after the add-on, usually `homeassistant`), and **disable key expiry** for it so it does not drop off after 180 days. Add tags or ACLs only if you share the tailnet with others.
5. Add-on options: keep the defaults. Leave `userspace_networking` as shipped. Check the add-on's Documentation tab for the exact option names, they change between versions.

Over SSH the same can be done with `ha addons install a0d7b954_tailscale` and `ha addons start a0d7b954_tailscale`, then read the login URL with `ha addons logs a0d7b954_tailscale`.

## 2. Install on the devices you travel with

Mac: the app is already there, log in with the same account. Phone: install the Tailscale app and log in. Check `tailscale status` shows the NUC.

## 3. Use it

With Tailscale switched on, the NUC is reachable at its Tailscale name or `100.x.y.z` address, instead of `192.168.1.77`:

| What | At home | Away (Tailscale on) |
|------|---------|---------------------|
| Dashboard | `http://192.168.1.77` | `http://<nuc-tailscale-name>` (HA answers on port 80, same as at home) |
| SSH | `ssh root@192.168.1.77` | `ssh root@<nuc-tailscale-name>` |
| Deploy | `tools/deploy.sh` | `HA_SSH_HOST=root@<nuc-tailscale-name> tools/deploy.sh` |
| Headless checks (`tools/page.js`, `dash.js`, `click.js`, `ha-ws.js`) | URL from `.env` | change `HOMEASSISTANT_URL` in `.env` and the URL argument to the Tailscale name |

The cards use relative URLs (`/local/...`) and HA's own connection, so they work on any address without changes.
The traffic is encrypted by WireGuard even though it is plain `http`.

The HA Companion app on the phone can add the Tailscale address as an *external URL* (Settings → Companion app → Server). If the app refuses plain `http` on that address, either set up HTTPS through Tailscale (`tailscale serve`, see the add-on docs) or use Nabu Casa for the phone only. Both are optional and are not needed for the Mac.

## Status (2026-10-20)

This repository is public: the real Tailscale address and tailnet name are therefore left out here (shown as `<nuc-tailscale-ip>` and `<tailnet>`). They are in the owner's private `.env` (`HOMEASSISTANT_URL_REMOTE`) and in the Tailscale admin console.

Set up and tested from home:
- Tailscale add-on installed on the NUC (`a0d7b954_tailscale` 0.30.2, start on boot and watchdog on), logged in as the owner's account.
- The machine is called **`homeassistant-1`**, Tailscale address **`<nuc-tailscale-ip>`**, key expiry **disabled**. The Mac is `thomass-laptop` (`<mac-tailscale-ip>`).
- Over the Tailscale address: ping works, the dashboard answers on port 80 (HTTP 200; port 8123 is not used), and `ssh root@<nuc-tailscale-ip>` works.
- **Tested from outside:** the Mac on an iPhone hotspot (not the home network) reached the dashboard (HTTP 200), the HA API (read a sensor with the token) and SSH (`ha core info`) through the Tailscale address. A direct connection was made (27 ms), no relay needed. Not yet tested: the phone's own Tailscale app.
- Away from home use `http://homeassistant-1.<tailnet>.ts.net` for the dashboard (not the IP: login says "Invalid client id", see below) and `HA_SSH_HOST=root@<nuc-tailscale-ip> tools/deploy.sh`. `.env` has `HOMEASSISTANT_URL_REMOTE` (not committed).

### Log in with the name, not the IP address

Opening the dashboard on `http://<nuc-tailscale-ip>` shows **"Invalid client id"** at login: Home Assistant only accepts a plain IP address for login if it is a private one (192.168.x.x and the like), and Tailscale's 100.x.x.x addresses are not. (Checked: `POST /auth/login_flow` answers "Invalid client id" for the IP and works for the names.)
Use the name instead, which works with the same Tailscale:

- `http://homeassistant-1.<tailnet>.ts.net` (full MagicDNS name), or the short `http://homeassistant-1`
- SSH and `tools/deploy.sh` still work with the IP: `HA_SSH_HOST=root@<nuc-tailscale-ip> tools/deploy.sh`, or with the name.
- Token API calls (`tools/*.js`, `.env`) work with either. `.env` has `HOMEASSISTANT_URL_REMOTE=http://homeassistant-1.<tailnet>.ts.net`.
- The Companion app on the phone: add the same name as an *external URL*.

## 4. Checklist to run at home

- [x] Tailscale add-on installed, started, logged in (same account as Mac and phone)
- [x] Key expiry disabled for the NUC in the admin console
- [x] `tailscale status` on the Mac lists the NUC
- [ ] Switch Wi-Fi off on the phone (mobile data) and open the dashboard through the Tailscale address
- [x] From the Mac on another network (iPhone hotspot): `ssh root@<nuc-tailscale-ip> 'ha core info'`
- [x] Note the Tailscale name here and in `.env` (see `.env.example`)

## 5. Parallel option kept open: Nabu Casa (standard solution)

Tailscale did not work on an earlier attempt (the cause is unknown), so the standard Home Assistant route stays open next to it:

| | Tailscale | Nabu Casa |
|---|---|---|
| Dashboard and custom cards | yes | yes (Settings → Home Assistant Cloud, remote control) |
| Companion app, push, voice assistants | with extra setup | built in |
| SSH and `tools/deploy.sh` from afar | yes | **no** |
| Updates from the HA UI | yes | yes |
| Cost | free | subscription |
| Works on a standard Telia router | yes (outbound only) | yes |

The two do not conflict. Plan: set up Tailscale first. If it fails again, read the add-on log (`ha addons logs a0d7b954_tailscale`) to see why before giving up, and fall back to Nabu Casa for the dashboard only. Then deploys wait until you are home.

## 6. Updating the NUC remotely

- Core, add-ons and Supervisor can be updated from Settings → System → Updates, or over SSH (`ha core update`, `ha addons update <name>`, `ha supervisor update`). Make sure the automatic backup before an update is on.
- **OS updates and anything that reboots the NUC: wait until you are home.** If it does not come back up you lose the remote access too (Tailscale runs on the NUC), and the Thread dongle and the OpenThread add-on must start again for the thermostats to be seen by HA. The thermostats keep regulating on their own meanwhile.
- Claude Code may restart HA Core but may not reboot or shut down the NUC (denied in `.claude/settings.json`).

## Switching between home and away

- At home: `HOMEASSISTANT_URL` in `.env` is `http://192.168.1.77`, `tools/deploy.sh` needs no extra variable.
- Away (Tailscale on): put the NUC's Tailscale name in `HOMEASSISTANT_URL_REMOTE`, use it as `HOMEASSISTANT_URL`, and run `HA_SSH_HOST=root@<name> tools/deploy.sh`. See `.env.example`.

## Security notes

- Keep the HA user with a strong password and turn on multi-factor authentication.
- The long-lived token in `.env` gives full access to HA: keep it out of git (it is in `.gitignore`) and out of chat.
- SSH to the NUC should use keys, not a password.
- Tailscale access control: devices on your tailnet can reach the NUC. Only add devices you trust.
- If a device is lost, remove it in the admin console at once.

## What is out of date

The older notes about the Raspberry Pi, the Eve Room, Greenely and Nord Pool via HACS were removed from this file: the box is an Intel NUC now, Nord Pool is a built-in integration (SE3, 15-minute prices, see `elpriskalkulator.md`), and the Eve Room is not in use. They are still in the git history.
