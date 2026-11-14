# Thread and Matter

The house runs Thread/Matter, not Zigbee. The old Zigbee devices (three SNZB-02P room sensors and a dry-contact relay) were removed
on 2026-10-19 and the Zigbee integration (ZHA) deleted.

## Hardware

| Part | Details |
|------|---------|
| Thread radio | Sonoff ZBDongle-E V2 (Silicon Labs EFR32MG21) in the NUC, flashed as an OpenThread RCP |
| Border router | OpenThread Border Router add-on, Thread network `ha-thread-f6e1` on channel 15 (preferred network in Home Assistant) |
| Controller | Matter Server add-on |
| Devices | IKEA TIMMERFLOTTE temperature/humidity sensor and LILJEBAGGE radiator thermostat (both in Stue), two IKEA KAJPLATS bulbs that also act as Thread routers |

## The firmware swap

Done from the Mac with the dongle plugged in there (`uvx universal-silabs-flasher`), using the community builds in
`github.com/darkxst/silabs-firmware-builder`, release `20250627`:

- Thread: `zbdonglee_openthread_rcp_2.5.3.0_GitHub-1fceb225b_gsdk_2024.6.3_no_flow_460800.gbl` (460800 baud, no flow control)
- Back to Zigbee: `zbdonglee_zigbee_ncp_8.0.3.0_sw_flow_115200.gbl` (it was on EZSP 7.4.4.0 before)

```
uvx universal-silabs-flasher --device /dev/cu.usbserial-120 \
  --probe-methods ezsp:115200,spinel:460800,bootloader:115200 flash --firmware <file>.gbl
```

Afterwards a probe with `--probe-methods spinel:460800 probe` should report `SL-OPENTHREAD/2.5.3.0`.

## Border router add-on settings

`device` = the dongle's `/dev/serial/by-id/usb-Itead_Sonoff_Zigbee_3.0_USB_Dongle_Plus_V2_...-if00-port0`, `baudrate` 460800,
`flow_control` **false** (this firmware has none; the add-on's default is true), `firewall` true, `nat64` false.

## Pairing a Thread device

1. Home Assistant app on the phone: Settings → Companion App → Troubleshooting → Sync Thread credentials.
2. Settings → Devices & services → Add device → Add Matter device → scan the code on the device.
3. Put the device in the Stue area.

## Link statistics (Thread card)

The Matter Server holds no subscription to the Thread diagnostics cluster (0x35), so `get_nodes` only returns what a device said when
it last joined: RSSI and the Tx counters stay identical for days. `config/scripts/thread_snapshot.py` therefore reads `0/53/*` live
from every available device with `read_attribute` (about 1 s each; a sleepy device on a weak link may need the second try).
`node tools/matter-ws.js root@<box> read_attribute '{"node_id":7,"attribute_path":"0/53/*"}'` does the same by hand.

"Lost today" on the card = (TxRetry + max-retry expiries) / (TxTotal + TxRetry) since the first run of the day, from counters that
count since the device booted (baseline in `/config/.thread_counters.json`; a falling counter means a reboot and the baseline
resets to zero). A message nearly always arrives after a retry, so this measures link quality, not data loss: the expiry counters
(frames given up) stay below 0.1 %. "Dropouts" = growth of DetachedRoleCount (the device lost its parent). The TIMMERFLOTTE
sensor exposes no counters. Values from 2026-11-05: Stue and Soveværelse sit at -90 dBm, and Astrid, with the best signal, has
the most dropouts (108 in 15 days).

## Going back to Zigbee

Flash the Zigbee firmware above, add the Zigbee integration again and restore the saved network data
(`/config/zigbee.db.pre-thread-backup` on the NUC). The devices would then reconnect.

## Peak shaving

Peak shaving through a Zigbee relay on the NIBE was removed together with the Zigbee devices. Its last working state, including
the rules and the automations, is in git commit `e75cb80`.

## The radio hangs (and the software reset)

The Thread radio (Sonoff ZBDongle-E in the NUC) has hung twice: **2026-11-11 about 16:44** and **2026-11-14 about 12:00**. The OpenThread Border Router add-on logs `RCP failure detected` and then `Too many rcp failures, exiting`, ends in state `error` and does not start again by itself. All Matter devices (thermostats, Timmerflotte, bulbs) go unavailable. A restart of the add-on does not help, because the radio firmware does not answer. Before 2026-11-14 only unplugging the dongle helped. Warnings of `ChannelAccessFailure` in the log shortly before suggest 2.4 GHz interference or USB 3 noise right at the NUC's port; a short USB extension cable to move the dongle away is the likely cure for the cause.

**Software reset:** the dongle's USB-serial chip drives the radio's reset pin from RTS. With DTR low, RTS asserted for 0.3 s and released resets the radio (log: `Extended Reset info: 0x301 (PIN)`). `config/scripts/reset_thread_dongle.py` does that, run by `shell_command.reset_thread_dongle` (in `configuration.yaml` on the box, backup `configuration.yaml.pre-threadreset`). The add-on must be stopped while it runs. A USB port reset from the SSH container is not allowed, and sysfs is read-only there, so the serial lines are the way.

**Automatic:** `config/automations/thread_recover.yaml` stops the add-on, sends the pulse and starts it again when at least 3 of the 4 thermostats and Timmerflotte have been unavailable for 5 minutes (at most once every 30 minutes). It tries up to twice (4 minutes apart) and logs each attempt in the logbook; if they are still gone after that, a notification says the dongle needs a physical replug. By hand: `hassio.app_stop`, `shell_command.reset_thread_dongle`, `hassio.app_start` (app `core_openthread_border_router`).
