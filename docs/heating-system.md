# Heating system (as described by the owner)

The heat pump heats a **water tank**, and the radiators draw from that tank.

- The tank is held at a constant **45–50 °C**. There is no weather-compensated flow temperature.
- The outdoor unit runs at **one fixed speed**, so it is either running or stopped.
- All radiators are connected **in parallel** to the tank, each with its own thermostat valve (IKEA LILJEBAGGE, see [liljebagge.md](liljebagge.md)). Each room is controlled on its own, and nothing is controlled at the supply line.
- Because the radiators draw from a buffered tank, opening many valves at once (for example when heating hard in the morning) does not push the heat pump itself: the tank takes the load and the compressor just runs longer.

## What this means for the controls

- **Fast recovery.** The water is always hot, so a radiator that opens after a setback delivers heat quickly. A deeper night setback costs little comfort in the morning.
- **Night mode** lowers each room's target by `input_number.night_setback` (now 2 °C) from 23:00 to 06:30 (`config/automations/night_mode.yaml`). 2 °C is a safe start. Check the room thermometer (Stue, Timmerflotte) the next morning: if the room is back up well before it is needed, raise the setback to 3 °C. Keep rooms in use at 17 °C or above to avoid damp.
- **Peak shaving** (not built yet) is done by lowering the thermostats in the expensive hours, not by changing the flow temperature. It only saves money if the radiators draw less, so the compressor stops earlier or starts later. The tank buffers the heat, so the effect is smaller than switching off a load directly. Measure before promising savings.
- The old idea of an offset relay on the NIBE supply line (commit `e75cb80`) is dropped for this reason.
- Radiators that sit far above the room temperature (valve reads 2-3 °C above the room) come from hot water around the valve, not from a faulty sensor.

## Settings used now

| Room | Day target (thermostat) | Night (23:00–06:30) |
|------|-------------------------|---------------------|
| Stue | 21 °C (room thermometer shows the real value) | 19 °C |
| Køkken | 21 °C (the thermostat reads about 2 °C high, so the room is about 19–20 °C) | 19 °C |

Regulation on the room thermometer is **not** used: the thermostat's temperature offset does not change what it reports, see [liljebagge.md](liljebagge.md). The two rooms are left to run on their own readings first, so the difference can be compared.
