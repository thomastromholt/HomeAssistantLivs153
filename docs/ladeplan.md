# Ladeplan

Mål: bilen (Kia Ceed PHEV) er **fuldt opladet kl. 07:00 hver morgen**, og den lader i de billigste timer. HA styrer både planen, start/stop og lastbalanceringen. Greenely styrer ikke længere laderen (Kia og Zaptec er fjernet fra Greenely).

Kørende kode: `config/automations/charge_plan_control.yaml` (plan + start/stop) og `config/automations/load_balance.yaml` (lastbalancering). Udrulles med `tools/deploy_automations.sh`.

## Planen (automation "Ladeplan, find ladetimerne")

1. **Hver time** (og ved HA-start) hentes Nord Pool SE3 for i dag og i morgen (i morgen fra ca. kl. 13).
2. **Antal timer** = det, bilen skal bruge for at være fuld kl. 07:00, **mindst 3**:
   `timer = max(3, ⌈(100 − batteri %) / 100 × 8,9 kWh / 0,9 / 2,3 kW⌉)`
   2,3 kW er målt 2026-10-30 (10–11 A på én fase, lastbalanceringen tillader op til 15 A). Uden batteri-aflæsning: 5 timer (nok fra tom).
   Eksempel: 16 % → 8,3 kWh → 4 timer. 60 % → 4,0 kWh → 2 → 3 timer.
3. **De billigste timer** fra den aktuelle time til kl. 07:00 vælges. **De behøver ikke ligge i træk.** Rangeringen sker på spotprisen. Afgifter og moms er lineære og ændrer ikke rækkefølgen.
4. Timerne skrives til `input_text.ladeplan` (timenumre siden 1970, kommasepareret), og `input_boolean.ladevindue` er tændt i en planlagt time.
5. Planen laves **altid**, også når bilen ikke er sat i, så man kan se, hvornår den vil lade.

Batteri-aflæsningen kan være et par timer gammel. Så bliver planen hellere for lang end for kort. Laderen stopper selv, når bilen er fuld (`connected_finished`).

## Start og stop (automation "Ladeplan, start og stop laderen")

Ladning er **tilladt** i en planlagt time eller efter **Lad nu**, medmindre **Stop ladning** er trykket. Lad nu og Stop slukkes, når bilen kobles fra.

Kører hvert minut og ved hver ændring:

- **Tilladt, laderen venter, og installationen står under 6 A:** installationens strøm sættes tilbage til 16 A. Under 6 A melder Zaptec "power restricted" og tilbyder ikke resume.
- **Tilladt, og laderen er pauset** (`connected_requesting`/`connected_finished`, resume tilbydes): tryk **resume**. Ved et tryk på kortet sker det med det samme. Automatiske genforsøg sker højst hver 5. min.
- **Tilladt, laderen tilbyder strøm, men bilen tager den ikke** (ingen resume-knap i 10 min): bilen startes fra Kia-siden (`switch.ceed_ev_charging`), højst hver 10. min. Ceed'en holder selv pauser på ca. 8 min og starter igen af sig selv.
- **Ikke tilladt, og den lader:** tryk **stop**, højst hvert minut.
- Bilen er fuld (≥ 99 %, Kia-data under 3 timer gamle): der startes ikke.

Mellem to planlagte timer, der ikke ligger i træk, stopper laderen og startes igen ved næste time.

## Lastbalancering

Se kommentaren øverst i `load_balance.yaml`. Kort fortalt holdes L1 under 20 A via laderens egen maks-strøm (`number.go2_charger_max_current`, 6–15 A) hvert 10. sekund. Over 20 A sættes den til 6 A i 30 min. Strømmen sænkes med det samme, men hæves først efter 15 min (Zaptecs anbefaling). Lastbalanceringen starter og stopper aldrig laderen.

## Dashboard

- **Elpris-kortet** (`www/elpris-24h.html`) tegner de planlagte timer blåt og viser "22–23, 03–05 · 166 öre" i forklaringen. Timerne læses fra `input_text.ladeplan`, så kort og automation viser det samme.
- **Bil-kortet** (`www/kia-ceed.html`): status fra Zaptec, ladeeffekt og knapperne:
  - **Lad nu** (grøn): bilen er sat i og kan lade.
  - **Stop ladning** (orange): ladning er i gang eller tilladt lige nu.
  - **Starter… / Stopper…** med spinner: fra trykket, til laderen melder den nye tilstand (højst 2 min). Derefter "Waiting for the car", hvis bilen holder pause.
  - **Følg plan**: Lad nu og Stop slås fra, og planen styrer.

## Data

- Batteri: 8,9 kWh (Kia Ceed SW PHEV). Virkningsgrad ca. 90 %.
- Bilen lader på én fase (L1). Målt 2,1–2,4 kW ved 10–11 A.
- Plugget i: afgøres af laderen (`sensor.go2_charger_mode` = `connected_*`), ikke af Kia. Kia-data kan være gamle.

## Overtag styringen af Zaptec (undersøgt 2026-10-27)

**Sådan gjorde Greenely.** Greenely logger ind på Zaptec-kontoen (Zaptecs API bruger OAuth med brugernavn og adgangskode) og styrer installationens *tilgængelige strøm* (`AvailableCurrent`). Det så vi i historikken 26. oktober: værdien sprang mellem 0, 16 og 0,06 A. Ved 0 A står laderen i "power restricted"/pause, selvom bilen er tilsluttet. Ved 6–16 A lader den. Der bliver ikke sendt start- eller stopkommandoer.

**HA kan gøre det samme.** Zaptec-integrationen i HA er logget ind med samme slags login og kan skrive `number.livlandsgatan_153_available_current`. Det betyder:
- Uden for ladevinduet: 0 A. Bilen kan være tilsluttet, og laderen starter selv, men den får ingen strøm.
- I ladevinduet: 6–16 A efter lastbalanceringen.
- Kontakten `switch.go2_charging` og knapperne bruges ikke til at styre: de bliver `unavailable`, når en session slutter, og er ikke pålidelige.

**Krav i Zaptec-appen/portalen:**
1. Installationen skal stå i **Default Charging Mode** (Settings > Power Management > Charging mode). Ellers ignoreres den tilgængelige strøm.
2. **Godkendelse (authorization/RFID) skal være slået fra.** Ellers kræver hver session RFID eller Zaptec-appen, og det kan API'et ikke klare.

**Zaptecs egen begrænsning:** Den tilgængelige strøm bør ikke ændres oftere end hver 15. minut. Hyppige ændringer kan få bilen til at afbryde opladningen. Den nuværende lastbalancering (hvert 10. sekund ved ændringer over 1 A) bryder den anbefaling og skal ændres: sænkning med det samme ved risiko for over 20 A, men forhøjelse højst hvert 15. minut.

**"Styres eksternt" i appen:** Ikke bekræftet, hvad der får Zaptec-appen til at vise den tekst. Den er sandsynligvis knyttet til partner-integrationer eller OCPP.

**Alternativer:**
- **OCPP direkte (lokalt).** Go 2 kan styres via OCPP 1.6J af et lokalt system (fx HA's OCPP-integration eller evcc). Hurtigt og uden skyen, men Zaptecs egen lastbalancering kan så ikke bruges, og Zaptec-appen mister styringen. Større ændring.
- **evcc** (som add-on). Understøtter Zaptec Go 2 via skyen (kræver sponsor-token), har `autoStartPrevention` (stopper automatisk start ved tilslutning), prisoptimeret opladning med "færdig kl." og lastbalancering i kredse. Lastbalanceringen er eksperimentel, og HomeWizard P1 har ingen færdig skabelon.

Kilder: [Zaptec: dynamic load balancing](https://docs.zaptec.com/docs/dynamic-load-balancing-with-the-zaptec-api), [Zaptec: API usage guidelines](https://docs.zaptec.com/docs/api-usage-guidelines), [Zaptec: API authentication](https://docs.zaptec.com/docs/api-authentication), [Zaptec: solar integration (OCPP)](https://docs.zaptec.com/docs/solar-integration-and-zaptec), [HA Zaptec-integration](https://github.com/custom-components/zaptec), [evcc: Zaptec Go 2](https://docs.evcc.io/en/chargers/zaptec-go-2), [evcc: load management](https://docs.evcc.io/en/features/loadmanagement), [Homey Zaptec-forum (godkendelse)](https://community.homey.app/t/app-pro-zaptec-charging/118631).

## Fejlfinding: korte ladeseancer (30/10 2026)

**Problemstilling:** Fra 27/10 gik bilen fra lange ladeseancer (45–99 min. under Greenely 26/10) til meget korte seancer (0–6 min. med HA lastbalancering 27-30/10).

**Årsag identificeret (30/10 19:14–19:29 UTC):**

Bilen pauserer naturligt hver ~5–6 minutter (karakteristik for Kia Ceed PHEV). I den anden seance efter første pause:
1. Bilen paused efter 5:40 min ved 10,3 A / 2,4 kW
2. Lastbalancering detekterede høj L1-forbrug og sænkede laderen fra 11 A → 6 A (inden bilen genoptog)
3. Bilen genoptog ved 6 A max-strøm, men kunne kun tegne 5 A, da nogle biler regulerer ned hvis max-strøm ændres under en session
4. Anden seance varede kun 4 min før bilen paused igen

**Rot cause:** Hyppige ændringer af laderen's max-strøm (load_balance.yaml) påvirker bilen negativt. Zaptecs dokumentation anbefaler højst hver 15 min. Når max-strøm sænkes under en pause, kan nogle biler afbryde helt i stedet for at genoptage.

**Løsning implementeret:** 
- Lastbalancering undgår nu hyppige ændringer ved at kun reagere på 20 A+ tærskel
- Sænkning sker med det samme (risiko), men ophævelse først efter 15 min (Zaptec-krav)
- Bilen får tid til at nå fuld strøm inden lastbalancering justerer ned

**Status 30/10 efter kl. 21:** Stabil opladning observeret igen.
