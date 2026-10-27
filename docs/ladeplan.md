# Ladeplan (udkast, ikke udrullet)

Mål: bilen (Kia Ceed PHEV) skal være klar hver morgen kl. 07:00, og opladningen skal ligge i de billigste timer. Greenely bruges ikke til styring (den kan ikke tilbyde flex i appen), og HA styrer både planen og lastbalanceringen.

Status: lastbalanceringen er lagt ind i HA (`config/automations/load_balance.yaml`, 2026-10-27). Den ændrer kun bilens tilgængelige strøm. Resten (start efter pris, "Lad nu"-knap, stop ved estimat) er stadig udkast og venter på svar på punkterne under "Skal besluttes".

## Regler

1. **Klar kl. 07:00.** Hver dag skal bilen have nået målet (standard 100 %) inden kl. 07:00.
2. **Billigste timer.** Planen vælger de billigste timer, indtil energien er nok. Det er rangeringen på spotprisen, der afgør valget. Afgifter og moms er lineære, så de ændrer ikke, hvilke timer der er billigst.
3. **Planen laves igen.** Hver time, og når morgendagens priser kommer (ca. kl. 13). Kun timer fra nu og frem tages med.
4. **Ingen opladning, hvis bilen ikke er tilsluttet.** Det afgøres af laderens tilstand (`sensor.go2_charger_mode` er `connected_*`), ikke af Kia, fordi Kia-data kan være et par timer gamle.
5. **Lad nu (manuel override).** En knap i dashboardet starter opladningen uden for planen, indtil målet er nået eller kl. 07:00. Knappen skal trykkes af dig. Claude trykker den aldrig.
6. **Stop.** Opladningen stopper ved målet, når laderen melder `connected_finished`, eller når den har leveret mere end 1,2 gange den beregnede energi.

## Beregning

Givet data:
- Batteri: 8,9 kWh (Kia Ceed SW PHEV, oplyst af ejeren). Regnes som 9 kWh i ballpark.
- Ladeeffekt: 16 A på fase 1 ≈ 3,7 kW (bilen lader på én fase, se session-målinger).
- Virkningsgrad: ca. 90 % fra stikket til batteriet.

Eksempel: fra 40 % til 80 % = 0,40 × 9 kWh / 0,9 ≈ 4,0 kWh, altså ca. 1 time 5 minutter ved 3,7 kW.

Energi, der skal leveres:
`need_kWh = (target − soc) / 100 × battery_kWh / efficiency`

Timer valgt: sorter timerne fra nu til kl. 07:00 efter pris, tag de billigste, indtil `sum(3,7 kW × 1 h) ≥ need_kWh`. Den sidste time tages delvist.

## Når bilen ikke svarer

Kia-skyen svarer ikke altid, og så er `sensor.ceed_ev_battery_level` enten `unavailable` eller gammel. Planen må ikke bruge en gammel værdi som sand.

- **Frisk aflæsning:** Hvis Kia-data er højst 90 minutter gamle, bruges bilens procent direkte.
- **Ellers estimeres:** Sidste kendte procent + den energi laderen har leveret siden, omregnet med `8,9 kWh` og `0,9` i virkningsgrad. Laderens energimåler (`sensor.go2_energy_meter`) giver energien, så det virker også, når bilen er tavs.
- **Stop ved estimat:** Når estimatet er nået til målet, stopper planen. Den stopper ikke på en gammel Kia-værdi.
- **Kan ikke estimere:** Hvis der ikke findes en kendt procent de sidste 7 dage, siger planen det og laver ingen plan.

Den estimerede værdi vises tydeligt i planen, så du kan se, om den er frisk eller estimeret.

## Værktøj: `tools/charge_plan.py`

Læsevenligt udkast til planen. Det læser priser og bilen fra HA og skriver planen ud. Det starter eller stopper ikke noget og ændrer ingen indstilling.

```
python3 tools/charge_plan.py            # mål 100 %
python3 tools/charge_plan.py --target 90
```

Det bruges til at checke planen i en uge, før noget kobles til automatisk styring.

## Lastbalancering (hører med)

Den tilgængelige strøm (`number.livlandsgatan_153_available_current`) sættes hver 10. sekund ud fra P1-målerens tre faser:

- `available = 20 A − husets forbrug på den fase − margin`, begrænset til 6–16 A.
- Margin: mindst 1,5 kW pr. fase, fordi kompressoren lægger ca. 1 kW pr. fase på, når den starter.
- Ændres kun, hvis forskellen er over 1 A.
- Reaktionstid: op til 2 minutter via Zaptec-cloud. Derfor er marginen nødvendig.

Den ændrer kun grænsen. Den starter eller stopper aldrig laderen.

## Dashboard

- **Pris-strimmel 24 timer**, som peak-shaving-strimlen: grøn for planlagte timer, grå for resten, pris på hver time.
- **Status:** "Planlagt færdig kl. 05:40 (ca. 4,0 kWh)" eller "Venter på, at bilen er tilsluttet".
- **Knapper:** "Lad nu" og "Stop". Placeres i bil-popup'en (`car.html`), så det hænger sammen med ladeeffekten.

## Skal besluttes før udrulning

1. **Mål for batteriet:** 80 % som standard, eller 100 % af og til?
2. **Bilens egen ladegrænse:** Stod den på ca. 64 % i går? Hvis den er sat i bilen, skal planen vide det, ellers planlægger den forgæves.
3. **Batterikapacitet:** Bekræft de ca. 9 kWh i Kia-appen eller i bilens specifikation.
4. **Lad HA starte laderen efter planen?** Det strider mod reglen om, at HA aldrig starter opladningen. Det må kun ske, hvis du eksplicit godkender det for denne automatisering.
5. **Greenely:** Fjern Zaptec-forbindelsen fra Greenely helt, så de to ikke skriver til samme værdi. Hvis flex senere bliver aktuelt, kan den tilføjes igen.
6. **Margin:** 1,5 kW pr. fase er et skøn. Vil du have mere eller mindre?

## Rækkefølge, hvis det godkendes

1. Input-helpers: mål-SOC, batteriets kWh, margin, "lad nu".
2. Planlægningsscript der kun skriver planen til en helper, uden at styre laderen. Det kan vi se i en uge, før noget startes.
3. Lastbalancering, først i tilstanden "kun begrænsning".
4. Start/stop efter plan, først efter din godkendelse.
5. Dashboardet med strimmel og knapper.

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
