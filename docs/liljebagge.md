# IKEA LILJEBAGGE radiator thermostat

Matter over Thread, in Stue (`climate.liljebagge_radiator_thermostat`). Firmware 1.1.6.

## Installing / calibrating

- **Fit the plastic pin** (the adapter pin that comes with it) before use. Without it the display shows **`Er1`**.
- With the pin in, **hold the minus button for a few seconds**. The thermostat calibrates: the motor runs for a while and the display blinks from left to right. When it is done the display shows the temperature.
- Do this again after moving the thermostat to another radiator or valve.

## Notes

- The device reports no motor state or error code to HA. The card infers status from availability, last report, battery and the firmware update.
- `hvac_action` can say "heating" with the valve reading far above the target, so treat it as unreliable.
- Changes made on the thermostat itself appear in HA within seconds. The card listens for them.
- Firmware updates run from HA (Matter server OTA) and make the LED blink until done.

## Room thermometer link (tried, removed)

Idea: set the thermostat's `temperature_offset` so its reading equals the Timmerflotte room thermometer (the valve sits on the radiator and reads 3-5 °C too high).
It does not work: changing the offset (-1, -2.5, -6) did not change `current_temperature` in HA, so a loop that reads it keeps lowering the offset until the limit. The automation was removed and the offset reset to 0.
The dashboard now shows both values and the difference instead. To try again, first check whether the offset changes what the thermostat does (not only what it reports), with a manual offset change and a few minutes of watching.
