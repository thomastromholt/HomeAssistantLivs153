# Stugan: hvad hænger på hvilken fase

Målt 2026-11-20 med Tibber Pulse (`sensor.tibber_pulse_sven_wallanders_vag_50_*`: effekt, strøm `current_l1`–`l3`, spænding `voltage_phase1`–`3`). Metoden: tænd eller sluk én ting ad gangen, og se, hvilken fases strøm der flytter sig. En logger skrev værdierne hvert 5. sekund.

## Det Pulse'en kan og ikke kan

- Pulse'en opdaterer hver 5.–10. sekund. Strømmen pr. fase har kun 0,1–0,2 A opløsning (cirka 25–45 W), og effekten er den samlede, ikke pr. fase. Effekt pr. fase er spænding × strøm.
- Små belastninger (under cirka 50 W, fx køleskab og frys) forsvinder i støjen. Baseline svinger ±20 W.
- Mills `current_power` (panelerne og stikket) er **ikke realtid**: den opdateres cirka hvert 11. minut og kan være op til to timer gammel. Brug Pulse'en til forsøg som dette.
- Mill-integrationen har automatisk opdatering slået fra (`pref_disable_polling`), fordi Mill har en grænse på antal kald pr. time. Værdierne opdateres kun ved opstart eller manuelt.

## Resultater

| Belastning | Fase | Størrelse | Sikkerhed |
|---|---|---|---|
| Varmepumpen (Sensibo) | **L1** | −1040 W og −4,7 A da den blev slukket 11:20:25 | sikker, L2 og L3 uændrede |
| Gæststuga-radiator (Mill) | **L1** | **−756 W** (2510 → 1754 W) og **−3,3 A** (L1 3,7 → 0,4 A) kl. 11:32:12–18 da ejeren slukkede den; Mill melder 763 W | sikker. Første forsøg kl. ~11:22 gik ikke igennem (Mills grænse), og Pulse'en faldt ikke |
| Resten ved siden af (baseline) | L1 | cirka 940 W i alt med Gæststuga-radiatoren tændt; L2 0,3–0,4 A, L3 0,2 A | pr. fase er det L1, der bærer næsten alt |
| Stuen-radiator (Mill) | **L2** | **−707 W** (2808 → 2101 W) og **−2,8 A** (L2 3,2 → 0,4 A) kl. 11:46:38 da den blev slukket i appen. Cirka 0,7 kW | sikker (L1 og L3 uændrede). Tændingen blev ikke set, kun slukningen |
| Zaptec-lader (Ceed) | **L3** | **15,3 A** og cirka **3,4 kW** (Zaptec: 3428 W; Pulse 4,7 kW i alt med varmepumpen), målt kl. 13:39 da ladningen startede fra appen | sikker. Enfaset lader på L3, samme fase som vandvarmeren og køleskabet |
| Køleskab | **L3** | **−103 W** (280 → 177 W) og **−0,5 A** (L3 0,7 → 0,2 A) kl. 11:35:41–47 da det blev slukket. Da det blev tændt (11:29:01–07): et stød til 0,6 A, så stabilt cirka +0,5 A | sikker (både tænd og sluk målt, kun L3 flyttede sig) |
| Kølefrys | ukendt | intet udslag kl. 11:18–11:20 | for lille eller starter forsinket |
| Vandvarmer | **L3** | **+1465 W** (935 → 2400 W) og **+6,1 A** (L3 0,2 → 6,3 A) kl. 11:26:53; L1 og L2 uændrede. Slukkede kl. 11:34:4x: −1438 W og −6,1 A. **Kørte cirka 8 minutter** (cirka 0,19 kWh), ikke de 15 ejeren troede | sikker |

Baseline uden varmepumpen: cirka 955 W, 3,8 A på L1, 0,3–0,4 A på L2 og 0,2 A på L3. Da Gæststuga-radiatoren var slukket (og køleskabet tændt): cirka 285 W (L1 0,4 A, L2 0,4 A, L3 0,7 A). Med køleskabet også slukket: **cirka 175 W** (L1 0,4 A, L2 0,4 A, L3 0,2 A). Det er husets faste last uden varme, vandvarmer og køleskab.

**Fordeling i korte træk:** L1: varmepumpe (cirka 1,0 kW) og Gæststuga-radiator (cirka 0,76 kW); L2: Stuen-radiator (cirka 0,7 kW); L3: vandvarmer (cirka 1,46 kW) og køleskab (cirka 0,1 kW). Uden Stuen er L2 næsten tom. Samtidig varmepumpe, begge radiatorer og vandvarmer giver cirka 4 kW (L1 alene cirka 8,5 A).

**Hovedsikringen på Stugan er 16 A pr. fase** (ejerens oplysning 2026-11-20). Laderen alene tager 15,3 A på L3, så en kørende vandvarmer (cirka 6 A) giver cirka 21 A og kan slå sikringen fra. Ejeren oplyser, at Pulse og Zaptec taler sammen på det lokale netværk, og at **Tibber selv lastbalancerer** mod Pulse'en, så den har styr på sikringen; når ladningen startes fra HA's dashboard, ser Tibber-appen den (ejerens iagttagelse), så den balancerer sandsynligvis også da. Det er ikke målt: næste gang vandvarmeren starter midt i en ladning, så tjek L3 og om ladestrømmen falder. Derfor har HA ingen egen lastbalancering på Stugan og rører ikke laderens strøm. Laderens `number.stugan_charger_max_current` står på 16 A (det højeste, den tillader; den stod på 32 uden for sit område). Jeg sænkede den kortvarigt til 9 A og satte den tilbage, fordi den ikke var bedt om.

**Pas på L3:** laderen (15,3 A) og vandvarmeren (6,1 A) på samme fase giver cirka **21,5 A**, og med køleskabet cirka 22 A. Hovedsikringen på Stugan er ikke noteret her. På Livlandsgatan holder lastbalanceringen L1 under 20 A; på Stugan findes den ikke.

## Varmepumpens effektfaktor (målt 2026-11-20)

Pulse'en måler strøm og spænding, ikke effekt pr. fase. For en radiator er watt = volt × ampere, men varmepumpens kompressor har en effektfaktor, der ændrer sig med lasten: cirka **0,82 ved lav last (3 A)** og cirka **0,98 fra 5 A**. Modellen i Strømforbrug-kortet er watt = volt × ampere × pf, hvor ampere er L1 over baseline (0,4 A, hele husets faste last 180 W) og minus Gæststuga-radiatoren. Testet mod husets samlede effekt med alt andet slukket: Resten = 186 W ±12 (før med pf = 1: 124 W ±49). Start og stop: varmepumpen når 3,2 A cirka 1 minut efter en startkommando og er nede på baseline cirka 20 sekunder efter en slukkekommando.

## Mill-panelernes mærkeeffekt

Mills `number.*_elektrisk_effekt` (indstillet maksimal effekt): Barnrum og Sovrum 700 W; Farstu, Stuen, Teknikrum, Gæststuga og varmepumpe-stikket 1000 W. Ejeren anslår, at en radiator trækker cirka 700 W; Mill målte 763 W på Gæststuga.

## Regler (må ikke glemmes)

- Skriv aldrig temperatur eller tilstand på **Teknikrum** og **Gæststuga** (frost og vandskade). Det gælder også i forsøg. Hvis en af dem slukkes til en test, skal den tændes igen bagefter.
- Mill har en grænse på antal kald pr. time. Hold genstarter af HA og genindlæsninger af Mill-integrationen nede, og brug Pulse'en til at måle.

## Mangler

- Fase for Barnrum, Sovrum, Farstu og Teknikrum (tænd én ad gangen i mindst 2 minutter).
- Hvor ofte vandvarmeren kører i hverdagen (fase, effekt og en kørsel på cirka 8 minutter er målt). De tidligere kandidater i Pulse (09:46–09:52, +1,4 kW, og en stigning fra 10:38) kan være vandvarmeren: de passer på størrelsen, men fasen blev ikke logget dengang.
- Fase for kølefrys, hvis det betyder noget (gav intet udslag).

## Mill: sådan læses og sættes temperaturerne (2026-11-20)

- **Rummene har tre temperaturer:** dag (`roomComfortTemperature`), nat (`roomSleepTemperature`) og away (`roomAwayTemperature`). Huset har en mode (`away`, `weekly_program` …), og hvert rum kan stå i sin egen mode. HA's Mill-integration viser dem ikke; den viser kun enhedens egen `temperature`, som ikke er den, panelet følger.
- **Læsning:** `config/scripts/mill_rooms.py` kalder Mills sky (sign-in, huse, husets enheder, ét kald pr. rum, cirka 10 kald) med det login, HA selv har gemt (`/config/.storage/core.config_entries`), og skriver svaret i `/config/.cache_mill_rooms.json`. Kun læsning. Cache: 10 minutter (`cached`), 60 sekunder ved `fresh`. På boksen i `configuration.yaml`, blokken `shell_command:`:
  `mill_rooms: python3 /config/scripts/mill_rooms.py cached` og `mill_rooms_fresh: python3 /config/scripts/mill_rooms.py fresh`. Kortet og dialogen kalder dem med `?return_response`. Opdater-knappen på Mill-kortet bruger `fresh`.
- **Sætning:** kun per rum med `mill.set_room_temperature` (`room_name` + `away_temp`; biblioteket sender kun de felter, man angiver). **Aldrig** `climate.set_temperature` på et Mill-panel: det sætter enheden i `control_individually`, og så følger panelet ikke rummets indstillinger ("room settings are not followed"). Dialogen sender kun enheds-temperatur til Sensibo.
- **Aldrig** skriv til Teknikrum og Gæststuga (frost, vandskade).
- **Mills grænse:** et antal kald i timen (sås som "> 2500"). De dyre kald er HA-starter (cirka 100 kald, 10 måneders statistik pr. enhed) og skrivninger (tømmer cachen). Derfor er automatisk opdatering slået fra (`pref_disable_polling`), og kort og dialoger lægges ud uden HA-genstart: kopiér filerne og giv kortene et nyt `?v=`-stempel gennem websocket (`lovelace/config` og `lovelace/config/save`).
- **Mills tal i HA er ikke realtid:** `current_power` er cirka 10 minutter bagud. Brug Tibber Pulse til forsøg med effekt.
