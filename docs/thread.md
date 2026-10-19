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

## Going back to Zigbee

Flash the Zigbee firmware above, add the Zigbee integration again and restore the saved network data
(`/config/zigbee.db.pre-thread-backup` on the NUC). The devices would then reconnect.

## Peak shaving

Peak shaving through a Zigbee relay on the NIBE was removed together with the Zigbee devices. Its last working state, including
the rules and the automations, is in git commit `e75cb80`.
