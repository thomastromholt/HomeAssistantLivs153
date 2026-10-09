# Peak shaving (NIBE night mode)

The only control is a fixed heat-curve offset: the normal curve is the comfort setting and night mode is **−3**.
There is no pre-heating (+3) and no night-time setback. The only goal is to hold back heat in the most expensive hours.

## Rules

Per calendar day, from that day's Nord Pool SE3 prices (hourly average of the 15-minute spot prices):

1. A block is exactly **2 hours in a row**.
2. At most **2 blocks per day**.
3. At least **2 normal hours between blocks** (the house recovers; no new peak right after a block).
4. Blocks are the highest-priced 2-hour windows, taken in order of price.
5. A block only counts if its average spot price is **at least 25 % above the day's average**. On a flat day there is no peak shaving.
6. The plan depends only on that day's published prices, so it is the same whenever it is computed (tomorrow's prices appear around 13:00).

Spot price decides the plan, not the total price: the grid fee and energy tax are fixed per kWh, so they don't change which hours are worth avoiding.

## Why these numbers

Measured on 2026-10-09 with the Stue sensor (exact change times are approximate):

- +3 at about 09:13 gave about +2.0 °C indoors, with a first response after about 25 minutes and about 6 hours to settle.
- −3 at about 15:35 gave a slow fall of about −0.4 °C/h, so a 2-hour block should cost well under 1 °C.
- Open: re-read the data around 18:00 to separate the −3 effect from the natural turnaround after the peak.

If 2 hours is barely noticeable, try 3-hour blocks later (about −1.2 °C).

## Where it lives

`elpris-24h.html`, the `PEAK_*` constants and `peakHours()`. The cards only show the plan (green = peak shaving, orange = normal); nothing controls the heat pump yet, and HA has no entity for the night-mode relay.
