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

## The rooms and the sun

| Room | Faces | What it means for heating |
|------|-------|---------------------------|
| Stue | morning and forenoon sun | Warms up by itself in the morning on sunny days: little or no pre-heat needed, and the room can pass the target before noon. |
| Køkken | south | Solar gain around midday and early afternoon; cooks and the oven add heat in the evening. |
| Astrid | north | The coldest room, never gets sun: needs the earliest pre-heat and may need a higher target for the same comfort. |
| Soveværelse (upstairs) | west | Afternoon and evening sun: warm in the evening, so the 16:00 pre-heat can be shorter on sunny days. Heat also rises from downstairs. |
| Kælder | (below ground) | Stable and cool; the target barely matters for how it cools. |

**Radiators:** Stue (120 cm) and Køkken (80 cm) have cast iron radiators, 60 cm high. **Soveværelse also has cast iron** (size not noted). **Astrid has a new radiator** (a modern one, type and size not noted), which reacts faster and holds less heat than cast iron. Stue therefore has about **1.5 times the capacity** of Køkken (2:3 by width), while Køkken faces south and airs often. At a fixed 45–50 °C supply the Køkken radiator has the least capacity to catch up after airing, which fits what we see (Køkken lags 2–3 °C behind its target in the afternoon). Cast iron holds a lot of water and iron, so it stays warm for hours after the valve closes (the thermostat on it reads high and says "heating" long after), reacts slowly, and radiates a larger share of its heat than a panel radiator (so reflector foil behind it is worth more than behind a panel radiator).

Because of this the same schedule behaves differently per room. Check each room against its own thermometer over a few days before copying settings between rooms. A later improvement is to skip or shorten pre-heat when the weather forecast promises sun.

## Open question: the outdoor sensor

The heat pump's outdoor sensor sits on the north side but gets morning sun until about 10–11. If the heat pump follows a heating curve, the sun can make it read too warm in the morning and lower the supply temperature, which then rises again only slowly after the sun is gone.
That would make the radiators weak around noon, exactly when the Køkken loses heat (airing 12–13, people home 12–13 and after 16).

**Waiting for data:** an ESP32 with supply and return temperature probes is on order (ordered 2026-10-20). Until it is installed nothing is changed here. The heat pump card (`www/heatpump.html`) already expects `sensor.heatpump_supply_temperature` and a power/energy sensor, so the probes can be named to match. Return temperature gives the heat delivered to the radiators (supply minus return).

Not confirmed. It conflicts with the earlier description of a constant 45–50 °C tank (a fixed supply temperature would not care about the sensor). To check, note the heat pump's outdoor reading and supply temperature at 08, 10, 12 and 14 and compare with the weather integration (`weather.forecast_home`). If the sensor is the cause: shade it, shift the curve up for the morning, or lengthen the averaging time if the unit has that setting.

## Seeing when the heat pump runs (P1 meter)

A HomeWizard P1 meter (HWE-P1, `192.168.1.59`, Local API on) reads the whole house. The outdoor unit is fixed speed and adds about 1 kW on **each of the three phases** at once, or nothing, so it shows up clearly: the house base load is 90–250 W per phase, and a running compressor puts every phase above 1.0–1.2 kW (measured 1161/1092/1085 W when it started on 2026-10-20).

- `binary_sensor.heatpump_compressor` (`config/templates.yaml`): on when all three phases are at 800 W or more, with a 15 s delay on and 30 s delay off. Single-phase loads (kettle, oven) never lift all three phases. Known false positives: 3-phase EV charging and a 3-phase hob plus oven.
- `sensor.heatpump_compressor_runtime_today` and `sensor.heatpump_compressor_starts_today` (`config/sensors.yaml`, history_stats).
- `sensor.heatpump_power` and `sensor.heatpump_energy_today` are **estimates**: 3 kW while running, runtime × 3 kWh. Not measurements.
- The NIBE card (`www/heatpump.html`) reads these, so the compressor tile, run time, starts, power and consumption are live. Supply temperature is still dummy until the ESP32 probes arrive.
- `config/configuration.yaml` on the box got two lines: `template: !include templates.yaml` and `sensor: !include sensors.yaml` (backup: `configuration.yaml.bak`).
- The energy dashboard has the P1 import and export as the grid source (no prices set).

The "Strømforbrug" card shows live power, a 24 h curve, today's kWh and whether the heat pump runs. Tapping it opens a detail view with the three phases, a month view (per day, a typical day, the highest hours) and a month selector. History starts on 2026-10-20, when the meter was connected.

### Later this winter: electric heating element (elpatron)

The heat pump will switch on its electric heater (elpatron) at times this winter. It suddenly draws about **1 kW more on each phase**, on top of the compressor (so roughly 2 kW per phase above the base load, 6 kW in total).

What this means for the sensors above (not changed yet, to be done when it first happens and can be checked against real data):
- The compressor sensor (all phases at 800 W or more) stays true while the elpatron runs, so "running" and the duty cycle will also count elpatron time. It cannot tell the compressor from the elpatron by itself.
- `sensor.heatpump_power` (3 kW) and `sensor.heatpump_energy_today` (runtime × 3 kWh) will then be too low during elpatron periods.
- Plan: a second sensor `binary_sensor.heatpump_elpatron` when all three phases are at about 1800 W or more (compressor plus elpatron), with its own delay. Power becomes 6 kW then, and the day's energy is runtime plus elpatron runtime. Note that 3-phase EV charging (1.4–3.7 kW per phase) and a 3-phase hob plus oven can look the same, so check the step size (+1 kW on all three phases at once) and the Zaptec state.
- The cost view (Strømforbrug) already uses the measured P1 consumption, so it is correct with the elpatron. Only the heat pump card's estimates are affected.
- An elpatron running is usually a sign that the heat pump cannot keep up (cold weather, defrost, hot water boost). Worth showing on the NIBE card when it is detected.

## Kælder (basement): plan and notes

- Four old radiators with very old manual valves (flow valves, no thermostat). All are connected **in parallel**, so each can be controlled on its own.
- Without thermostats the temperature floats with the weather and the outdoor/indoor heat gains, and the 45–50 °C water means the radiators give heat whether it is needed or not. The basement temperature is not known today.
- Wanted: 16 °C normally, 18 °C from 16:00 to 23:00 when the family is home. Keep it above 14–16 °C and under 60 % humidity (mould).
- To control it the radiators need new thermostatic valve bodies/inserts (plumber's job; ask whether each radiator has its own shut-off so one can be changed at a time without draining the system). Then a LILJEBAGGE per radiator that is actually needed.
- **A dehumidifier runs in the basement all the time, set to 50 % RH.** It is not measured, so its energy is part of "everything else" in the Strømforbrug card. Typical units draw 200–400 W while running, which is 5–10 kWh a day if it runs all day: that could be 10–20 kr a day at today's prices, more than most heating tweaks. To be measured with a smart plug with energy metering (for example the IKEA INSPELNING, Matter over Thread).
  - The unit is a plain Woods dehumidifier drawing **270 W** while running, with a humidity setting of 50 % now (it can also be set to 60 %). 270 W round the clock is 6.5 kWh a day, about 13 kr a day at an average total price of 2 kr/kWh (roughly 390 kr a month); it will be less if it cycles. If it never reaches 50 % it runs all day.
  - Plan: put it on an energy-metering smart plug for a week at 50 %, then a couple of weeks at 60 %, and compare kWh and the basement humidity. Mould needs long periods above about 65–70 %, but a cold wall is more humid than the room air, so 60 % is a try, not a rule; check the walls and stored things.
  - Cooler air holds less moisture, so lowering the basement temperature raises the relative humidity and makes the dehumidifier work harder: part of the heating saving is paid back there. Compressor dehumidifiers also work badly below about 10–15 °C (they ice up), so 16 °C is close to the lower limit for that type. Desiccant types cope with cold but use more power.
  - With 50 % RH held by the dehumidifier the 60 % humidity limit is not a worry as long as it keeps up. Worth checking whether 55–60 % is enough, and whether it can run mostly in the cheapest hours.
- Cheap first steps: put a Timmerflotte (or a plain thermometer) in the basement and log it for a week; then close two of the four radiators on the old valves for a week and see where the temperature settles. Often two are enough, and only those need thermostats. KAJPLATS 1000 lm in the basement is a Thread router, so coverage is good.
- Status: not started. Waiting for the owner's measurements and for a look at the valves (photos of a valve and of the pipes).

## Evaluation of night mode and peak shaving (2026-10-20)

- Night mode (23:00–06:30, −2 °C, both rooms) works: Stue fell from 21.8 to 19.1 °C overnight and was back at 20.2 °C an hour after 06:30. The saving is small (about 5 % per degree, but only for 7.5 hours, a bit under 1.5 % of the day's heat in those rooms). It is a fixed energy saving, not price-driven.
- Peak shaving with the radiators looks like a small gain: the compressor runs roughly 20–30 % of the time, so a 2-hour block avoids about 1.5–2 kWh, and with a 1 kr/kWh price spread that is about 2 kr per block (60–120 kr a month), and the rooms get a bit colder. Earlier tests with the supply-curve offset only lowered the rooms by about 0.7 °C in the morning and barely in the evening. These are estimates; the meter and the price give the data to check them after a couple of weeks.
- Bigger levers, in order: (1) charge the car in the cheapest hours (Zaptec Go2), (2) avoid the elpatron (it adds about 3 kW), (3) check the outdoor sensor and supply temperature (ESP32 probes on order), (4) control the basement. Peak shaving can wait for measured data.

## Bedrooms: day plan (Soveværelse and Astrid)

Both bedrooms follow the same plan. **Weekdays:** **20 °C from 16:00 to 07:00**, when the family is home and sleeping, and **18 °C the rest of the day**. **Weekends:** **20 °C all day** (Friday 15:00 raises it, and nothing lowers it again until Monday 07:00). They have no night setback (the opposite of Stue and Køkken). `config/automations/bedroom_schedule.yaml` tells the two thermostats at **15:00** (a one hour lead, because the cast iron radiators are slow) and at **07:00**. It only runs at those two times, so a change made by hand stays until the next switch. Soveværelse has cast iron (slow), Astrid a new radiator (faster): the one hour lead fits the bedroom; Astrid's room probably needs less (about 30 minutes) and can get its own time once its warm-up has been measured. The Airthings stands in Astrid's room for now and is shown there as the room thermometer.

## Firmware updates of the thermostats

All four LILJEBAGGE thermostats are on firmware 1.1.6 (2026-10-21). `config/automations/firmware_updates.yaml` installs pending updates on weekdays at 10:00, one thermostat at a time and only if its battery is above 30 %. An update that has been "skipped" in Home Assistant is not installed (the update entity reads "off"; run `update.clear_skipped` to offer it again). HA's `automations.yaml` on the box is `room_plans.yaml` followed by `firmware_updates.yaml` (not `peak_shaving.yaml`).

## Settings used now: one plan per room

Every room has a plan for **weekdays** and one for **weekends**, stored in Home Assistant as text (`input_text.plan_<room>_weekday` and `plan_<room>_weekend`), for example `0:low,6.5:warm,8:low,15:warm,23:low` = from 00:00 low, from 06:30 warm, from 08:00 low, from 15:00 warm, from 23:00 low (hours as numbers, 6.5 = 06:30). The level is **warm** or **low**; their temperatures are `input_number.warm_<room>` and `low_<room>`. Night mode is simply part of the plan: it is the "low" level in the night. The pop-up of each room shows the plan with a marker for where we are now.

`config/automations/room_plans.yaml` checks every 5 minutes (and when Home Assistant starts) whether a room's level has changed and only then sends a command, so a temperature set by hand stays until the next change. If someone turns a thermostat up or down by hand, the value is remembered as the room's temperature for the level that was active (the learning automation in the same file).

| Room | Warm | Low | Weekday plan | Weekend plan |
|------|------|-----|--------------|--------------|
| Stue | 21 | 19 | low until 06:30, warm 06:30–08:00, low 08:00–15:00, warm 15:00–23:00, low from 23:00 | low until 06:30, warm 06:30–23:00, low from 23:00 |
| Køkken | 21 | 19 | same as Stue (the thermostat reads about 2 °C high) | same as Stue |
| Soveværelse | 21 | 18 | warm until 07:00, low 07:00–15:00, warm from 15:00 (told an hour before 16:00) | warm all day |
| Astrid | 21 | 18 | same as Soveværelse | warm all day |

To change a plan, edit the text of the helper (Settings → Devices & services → Helpers), or change the temperatures there. The 5 minute check picks it up. The old night mode (a separate automation with its own helpers) is gone.

Regulation on the room thermometer is **not** used: the thermostat's temperature offset does not change what it reports, see [liljebagge.md](liljebagge.md). The two rooms are left to run on their own readings first, so the difference can be compared.
