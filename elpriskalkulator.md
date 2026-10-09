# Elpriskalkulator - Livlandsgatan 153

What you actually pay per kWh, from the Nord Pool SE3 spot price (hourly average of the 15-minute prices):

```
Greenely price = (spot + 26 öre) × 1.25
Total          = Greenely price + 26 öre (Ellevio grid fee) + 45 öre (energy tax)
```

The Ellevio fee and the energy tax are billed incl. VAT (see the invoice); the 26 öre of Greenely fees is before VAT.

## Calibration (2026-10-09)

| Hour | Hourly avg spot | Greenely app |
|---|---|---|
| 16:00 | 46.80 öre | 91 öre |
| 19:00–20:00 | 76.40 öre | 128 öre |

Slope 37 / 29.6 = exactly 1.25 (the VAT), intercept 32.5 = 26 × 1.25. Two points fit exactly, so check against a third reading when convenient.

## Constants

`elpris-24h.html`: `SUPPLIER_FEES_ORE`, `VAT`, `GRID_FEE_ORE`, `ENERGY_TAX_ORE`.
Ellevio's rates are for a 3 × 20 A connection in Stockholm (fixed fee 590 kr/month is not part of the per-kWh price).
