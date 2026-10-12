# Peak shaving (NIBE heat curve −3)

The only control is a fixed heat-curve offset: the normal curve is the comfort setting and peak shaving is **−3** (called night mode in the NIBE and eWeLink apps).
There is no pre-heating (+3) and no night-time setback. The only goal is to hold back heat in the most expensive hours.

## Rules

Per calendar day, from that day's Nord Pool SE3 prices (hourly average of the 15-minute spot prices):

1. A block is exactly **2 hours in a row**.
2. At most **2 blocks per day**.
3. At least **2 normal hours between blocks** (the house recovers; no new peak right after a block).
4. Blocks are the highest-priced 2-hour windows, taken in order of price.
5. A block only counts if its average spot price is **at least 25 % above the day's average**. On a flat day there is no peak shaving.
6. A block only counts if it is **at least 40 öre/kWh dearer than the 4 hours after it** (price you pay, incl. VAT; no later hours that day means no check). That gap is what a block saves per kWh it shifts, because the held-back heat is made up in those hours. Without it a block on a high-price day, where everything is above average, saves almost nothing.
7. The plan depends only on that day's published prices, so it is the same whenever it is computed (tomorrow's prices appear around 13:00).

Spot price decides which hours are dear, not the total price: the grid fee and energy tax are fixed per kWh, so they don't change which hours are worth avoiding. The 40 öre gap is stated in the price you pay, which is 1.25 times the spot difference because of VAT.

The 40 is a starting point (on 2026-10-12 it dropped a 09–11 block that saved 31 öre/kWh and kept ones saving 62 to 173). Once the meter reader shows how much energy a block really shifts, set it from the break-even.

## Why these numbers

Measured on 2026-10-09 with the Stue sensor (exact change times are approximate):

- +3 at about 09:13 gave about +2.0 °C indoors, with a first response after about 25 minutes and about 6 hours to settle.
- −3 at about 15:35 gave a slow fall of about −0.4 °C/h, so a 2-hour block should cost well under 1 °C.
- Open: re-read the data around 18:00 to separate the −3 effect from the natural turnaround after the peak.

If 2 hours is barely noticeable, try 3-hour blocks later (about −1.2 °C).

## How it controls the heat pump

`switch.dry_relay` (Zigbee dry contact) is wired to the NIBE's external adjustment input. **Closed = peak shaving (−3), open = normal.**
After a power cut the relay comes back open (its power-on behaviour), so a failure means normal heating.

Two automations in `config/automations/peak_shaving.yaml` (this file *is* `/config/automations.yaml` on the box):

1. **Peak shaving: compute plan.** Every hour at :02 (and at start) it reads today's and tomorrow's Nord Pool prices and writes the plan into `input_text.peak_shaving_plan`, e.g. `2026-10-11:18,19;2026-10-12:9,10,17,18`. The Jinja template applies the rules above and gives the same answer as the price card (checked on real prices).
2. **Peak shaving: switch the heat pump relay.** On the hour, and whenever the mode or plan changes, it closes the relay in a planned hour and opens it otherwise. Anything unexpected (no plan, unknown mode) means open.

`input_select.peak_shaving_mode` is the manual override, also on the heat pump card: **Auto** follows the plan, **On** keeps the relay closed, **Off** keeps it open.

The helpers were created through HA (not in YAML). To change the automations, edit `config/automations/peak_shaving.yaml`, copy it to `/config/automations.yaml` and reload automations.

## Where else it lives

`www/elpris-24h.html` (`PEAK_*` constants, `peakHours()`) draws the plan on the price card; `www/heatpump.html` shows the relay, the plan summary and the mode control. The rules exist twice (card and automation), so change both together.
