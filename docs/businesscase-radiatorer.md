# Businesscase: radiatorstyring og reflektorfolie

Dato: 2026-10-20 (rettet samme dag efter nyt forbrugstal). Skrevet til ejeren af Livlandsgatan 153.
Alle tal er **skøn** ud fra tommelfingerregler og få dages målinger. Intet er målt over en hel sæson. Opdatér tallene, når målingerne kommer (afsnit 10).

## 1. Konklusion

Basis: huset brugte **25.000 kWh i kalenderåret 2025, uden elbilen**.

| Case | Pris | Mid: netto pr. år | Tilbagebetaling (mid) | NPV (mid) | Kort dom |
|---|---|---|---|---|---|
| A. 5 nye ventilhuse + 5 LILJEBAGGE | cirka 7.000 kr | cirka 1.200 kr | cirka 6 år (mod ingenting) | +5.800 kr (15 år) | Mod ingenting 6 år. Men to ventiler skal skiftes alligevel (lækage og en, der ikke kan justeres), og drosling er gratis: **resten betaler sig på cirka 11 år og er i mid næsten break-even.** |
| B. Reflektorfolie, 5 radiatorer | 1.000 kr | cirka 225 kr | cirka 4,5 år | +1.100 kr (12 år) | **Rimelig** på radiatorer ved ydervæg. Støbejern giver mere end panelradiatorer. |
| C. 5 LILJEBAGGE på rum med termostatklare ventiler | 1.000 kr | cirka 700 kr (320 kr uden peak shift) | cirka 1,4 år (3,1 år) | +3.700 kr (8 år) | **Den bedste af de tre.** Billig, og besparelsen er størst, hvis peak shift virker. |

Det største enkelte fund er ikke en af de tre: **en grad lavere temperatur i hele huset sparer cirka 750 kWh, altså cirka 1.650 kr om året** (mid). Det er mere end hele nat- og hverdagsskemaet tilsammen (cirka 370 kr). Se afsnit 7.

## 2. Forudsætninger

Husets 25.000 kWh fordeles således (skøn, skal tjekkes):

| Post | kWh pr. år |
|---|---|
| Affugteren i kælderen (270 W døgnet rundt) | cirka 2.400 |
| Husholdning (hvidevarer, lys, elektronik) | cirka 4.000 |
| Varmepumpe inkl. varmt brugsvand (og evt. elpatron) | cirka 18.600 |
| heraf varmt brugsvand | cirka 3.000 |
| **heraf rumopvarmning (radiatorerne)** | **mid 15.000 (lav 11.000, høj 18.000)** |

| | Lav | Mid | Høj |
|---|---|---|---|
| Elforbrug til rumopvarmning pr. år | 11.000 kWh | 15.000 kWh | 18.000 kWh |
| Pris pr. kWh i alt (spot, afgifter, moms) | 1,8 kr | 2,2 kr | 2,6 kr |
| Besparelse pr. grad lavere temperatur | 5 % | 5 % | 5 % |
| Andel af husets varme, de berørte rum dækker | 25 % | 40 % | 55 % |

- Prisen følger `docs/elpriskalkulator.md`: (spot + 26 öre) × 1,25 + 26 + 45 öre.
- **Abonnement:** fast 20 A. Der er **ingen effekttarif**, så der er ingen penge i at sænke kW-toppe. Peak shift handler kun om spotprisen. Hovedsikringen (3 × 20 A, cirka 13,8 kW) er en grænse for, hvad der må køre samtidig (varmepumpe, elpatron, bil, komfur).
- Kompressoren har fast hastighed (3 kW). 18.600 kWh svarer til cirka 6.200 driftstimer eller 71 % af året. Det er højt, og det tyder på, at **elpatronen har kørt en del** i 2025. Elpatron giver 1 kWh varme for 1 kWh strøm (varmepumpen giver cirka 2,7), så hver sparet kWh varme er dyrere at lave på elpatron. Hvis elpatronen står for meget af forbruget, er besparelserne her **højere**, men antallet af kWh til rumopvarmning kan også være lavere. Det kan vi se, når vi måler driftstid og elpatron.
- Tanken står på 45–50 °C hele tiden, så en termostat kan kun spare varme i sit eget rum.
- Afskrivning: 4 % rente. Levetid: LILJEBAGGE 8 år, reflektorfolie 12 år, ventilhuse 30 år (LILJEBAGGE udskiftes efter 8 år).

## 3. Huset: hvad væggen, radiatorerne og målingerne siger

**Væggen** er 10 cm: træpanel og 2 cm træspånsisolering, resten træ. U-værdi cirka **0,9–1,3 W/m²K** (nybyggeri 0,15–0,20). Det er en dårligt isoleret væg, og en radiator ved ydervæggen taber en del af sin varme bagud.

**Radiatorerne** er støbejern, 60 cm høje: Stue 120 cm, Køkken 80 cm. Støbejern holder varmen i timer efter, at ventilen lukker, og sender en større del af varmen som stråling end en panelradiator.

**Stuen om natten** (målt 19.–20. oktober, mål 21 → 19 °C, udetemperatur cirka 8–9 °C):
- Rummet faldt fra 21,8 til 19,1 °C, cirka 0,35 °C i timen, så tidskonstanten er cirka **33 timer** (cirka 1 kWh pr. grad, cirka 30 W tab pr. grad). Stuen køler langsomt af.
- Gennemsnitlig sænkning over natten var kun cirka 0,9 °C, selv om målet var 2 °C lavere.
- **En nat sparer cirka 0,2 kWh varme, cirka 0,16 kr, i stuen.** Sæson: cirka 25–30 kr for det rum.

Langsom afkøling er godt for peak shift: et rum med lukket radiator mister kun cirka 1 °C på 2 timer ved 0 °C ude.

## 4. Case A: 5 nye ventilhuse + 5 LILJEBAGGE (cirka 7.000 kr)

6.000 kr til VVS og ventilhuse plus 5 × 200 kr til LILJEBAGGE. Om cirka 8 år skal LILJEBAGGE skiftes (1.000 kr). For de radiatorer, der i dag ikke kan styres (kælderen m.fl.).
Antagelser: rummene ligger 1 / 2,5 / 4 °C højere end nødvendigt, og radiatorerne dækker 15 / 25 / 35 % af husets varme.

| | Lav | Mid | Høj |
|---|---|---|---|
| Temperaturspar (kWh/år) | 82 | 469 | 1.260 |
| Spar i kr (energi) | 148 | 1.031 | 3.276 |
| + peak shift | 55 | 234 | 630 |
| − batterier | 100 | 50 | 25 |
| **Netto pr. år** | **104 kr** | **1.216 kr** | **3.881 kr** |
| Tilbagebetaling | 75 år | 6,4 år | 2,0 år |
| NPV (15 år, 4 %) | −6.600 kr | +5.800 kr | +35.400 kr |
| ROI over 15 år | −80 % | +136 % | +653 % |

**Det vigtige:** Cirka 70 % af temperatursparer kan fås **gratis**, hvis du blot lukker eller drosler ventilerne på de gamle radiatorer. Det, som kun termostaterne giver (de sidste 30 %, skemaet og peak shift):

| | Lav | Mid | Høj |
|---|---|---|---|
| Gratis alternativ (manuel drosling) | 104 kr | 722 kr | 2.293 kr |
| **Kun det, de 7.000 kr køber ekstra** | **0 kr** | **494 kr/år** | **1.588 kr/år** |
| Tilbagebetaling | aldrig | **15,7 år** | 4,9 år |
| NPV (15 år) | −7.700 kr | **−2.200 kr** | +9.900 kr |

Case A bærer sig altså kun, hvis rummene i dag ligger **meget** for varmt (mere end 3–4 °C) og de berørte radiatorer dækker en stor del af varmen. Test det gratis først (afsnit 10). Andre grunde til at gøre det: stabil temperatur uden at justere ved vejrskift, skema (16 / 18 °C) uden at dreje på ventilerne, og indregulering af flowet (kan give lavere returtemperatur og bedre COP, ikke regnet her).
Spørg VVS'eren, om kun indsats eller adapter er nok i stedet for hele huse. Se `docs/vvs-briefing.md`.

### To ventiler skal skiftes alligevel (lækage og en, der ikke kan justeres)

I kælderen lækker en ventil og skal skiftes, og en anden kan ikke justeres. Det ændrer sammenligningen:
- De to ventiler skal repareres **uanset hvad**: cirka 2 × 1.200 kr = **2.400 kr** (samme pris pr. ventilhus som i tilbuddet, skøn).
- Den gratis løsning ("luk ventilerne med hånden") virker kun på ventiler, der kan justeres. Efter en reparation kan de.
- Det rigtige valg er derfor ikke "gør ingenting eller køb alt", men **"reparér to ventiler" eller "skift alle fem og sæt termostat på"**. Merprisen for at gå hele vejen er cirka 5.300 kr (7.731 minus 2.400).

| Sammenligning (mid) | Netto pr. år | Tilbagebetaling | NPV (15 år) |
|---|---|---|---|
| A mod ingenting (ventilerne forbliver, som de er) | 1.216 kr | **6,4 år** | +5.800 kr |
| A mod gratis manuel drosling | 494 kr | 15,7 år | −2.200 kr |
| **A mod "reparér de to ventiler" (det rigtige valg)** | **494 kr** | **10,8 år** | **+160 kr (næsten break-even)** |
| Samme, lav / høj | 0 kr / 1.588 kr | aldrig / 3,4 år | −5.300 kr / +12.300 kr |

Almindelige termostater (cirka 200 kr stykket, ingen batterier, intet skema) i stedet for LILJEBAGGE giver cirka 1.030 kr om året mod ingenting, men kun cirka 310 kr over "reparér de to" (15 år, NPV −1.200 kr i mid). LILJEBAGGE giver mest, fordi skema og peak shift lægger sig oveni, men det er de dele, vi er mest usikre på.

**Seks år er stadig rigtigt for "A mod ingenting".** Det vil sige: hvis du alligevel ikke ville røre ventilerne, tjener de 7.000 kr sig ind på cirka 6 år. Men fordi du alligevel skal bruge 2.400 kr på to ventiler, og fordi manuel drosling er gratis, er merværdien af resten **cirka 11 år og i mid næsten break-even**.

## 5. Case B: reflektorfolie bag radiatorerne (200 kr pr. stk., 1.000 kr for 5)

En radiator ved ydervæg sender en del af sin varme bagud mod væggen (cirka 70–100 W). Folien reflekterer det tilbage, så væggen bliver koldere og taber mindre. Med din væg (U cirka 0,9–1,3) går cirka en fjerdedel af den varme, væggen modtager, ud gennem den. Støbejernsradiatorer sender mere stråling end panelradiatorer, så tallene her er sandsynligvis i den **øvre** halvdel. Astrids nye radiator er sandsynligvis en panelradiator med mindre stråling og mindre effekt af folie, så den bør ikke regnes med.

| | Lav | Mid | Høj |
|---|---|---|---|
| Sparet effekt, mens radiatoren er varm | cirka 16 W | cirka 18 W | cirka 24 W |
| Timer varm pr. år | 1.800 | 3.000 | 4.000 |
| Sparet varme pr. radiator | cirka 29 kWh | cirka 55 kWh | cirka 96 kWh |
| Besparelse pr. radiator | cirka 19 kr | cirka 45 kr | cirka 93 kr |
| **For 5 radiatorer, netto pr. år** | **49 kr*** | **225 kr** | **465 kr** |
| Tilbagebetaling | 20 år | 4,5 år | 2,2 år |
| NPV (12 år, 4 %) | −540 kr | +1.100 kr | +3.400 kr |
| ROI over 12 år | −42 % | +170 % | +458 % |

\* Lav: halvdelen af radiatorerne ved indervæg, eller folien sidder løst.

- Virker **kun på radiatorer ved ydervæg.** Ved indervæg er effekten nul.
- Ingen batterier, ingen radio, ingen drift. Billigste prøve: 200 kr på én radiator ved en kold ydervæg.
- Effekten (cirka 20 W af mange hundrede) er svær at måle, så en prøve siger mest om montage og udseende.

## 6. Case C: 5 LILJEBAGGE på rum med termostatklare ventiler (cirka 1.000 kr)

Her er ventilerne i orden, og LILJEBAGGE giver skema (nat, hverdage væk), overblik og fjernstyring. Effektiv sænkning pr. døgn er beregnet med de målte tal fra stuen (afsnit 3).

| | Lav | Mid | Høj |
|---|---|---|---|
| Nattesænkning: effektiv sænkning pr. døgn | 0,20 °C | 0,31 °C | 0,40 °C |
| Hverdage væk 8–15: effektiv sænkning pr. døgn | 0,15 °C | 0,25 °C | 0,35 °C |
| Energi nat + væk (kr/år) | 87 | 370 | 965 |
| + peak shift | 92 | 375 | 990 |
| − batterier | 100 | 50 | 25 |
| **Netto pr. år** | **78 kr** | **695 kr** | **1.930 kr** |
| Tilbagebetaling | 12,8 år | 1,4 år | 0,5 år |
| NPV (8 år, 4 %) | −470 kr | +3.700 kr | +12.000 kr |
| ROI over 8 år | −37 % | +456 % | +1.444 % |
| **Uden peak shift: netto pr. år** | −13 kr | 320 kr | 940 kr |
| **Uden peak shift: tilbagebetaling** | aldrig | 3,1 år | 1,1 år |

- **Peak shift** udgør over halvdelen af mid. Den hviler på antagelser: to blokke á 2 timer om dagen i cirka 200 fyringsdage, halvdelen af den teoretiske flytning er realistisk, og en prisforskel på 0,75 kr/kWh. Uden effekttarif tæller kun spotprisen. Hele huset i bedste tilfælde ville give cirka 1.900 kr. **Mål det, før du regner med det.**
- Batterierne kan æde en del. Hold øje med batteriprocenten i 30 dage og beregn levetiden.
- Hvad man også får: skema uden at skrue, grafer, advarsel ved lavt batteri eller offline, og data til resten af regnestykkerne.
- Soveværelset skal **ikke** have nattesænkning (20 °C, når I sover, og 18 °C ellers). Det er derfor ikke med i nattebesparelsen. Astrid har heller ikke nattesænkning.

## 7. Det største fund: hele husets temperatur

| Tiltag (mid) | Spar pr. år |
|---|---|
| **1 °C lavere i hele huset, hele året** | **cirka 1.650 kr (750 kWh)** |
| 1 °C lavere i de 40 % af varmen, der er termostatstyret | cirka 660 kr |
| Nat −2 °C (kun styrede rum) | cirka 205 kr |
| Hverdage væk −3 °C (kun styrede rum) | cirka 165 kr |
| Nat og væk sammen | cirka 370 kr |

Det vil sige: **sæt stuens og køkkenets dagmål 1 °C ned (21 → 20 °C)**, og du har sparet mere end hele skemaet. Det koster ingenting. Prøv det, og se, om det føles forkert.

## 8. Større muligheder uden hardware

| Tiltag | Skøn pr. år | Pris |
|---|---|---|
| 1 °C lavere dagmål (stue og køkken, 40 % af varmen) | cirka 660 kr | 0 kr |
| Affugteren i kælderen på 60 % i stedet for 50 % (270 W døgnet rundt, cirka 2.400 kWh, cirka 5.200 kr, 9,5 % af husets forbrug) | cirka 1.000–2.000 kr brutto, mindre netto | 0 kr (smart stikkontakt til måling 150–300 kr) |
| Smart ladning af bilen (bilen er **oveni** de 25.000 kWh; cirka 1.300 kWh, 0,5–1 kr/kWh billigere) | cirka 650–1.300 kr | 0 kr |
| Undgå elpatronen (3 kW, hver time koster cirka 6,6 kr) | 500 timer sparer cirka 3.300 kr | 0 kr |
| Luk 2 af 4 kælderradiatorer på de gamle ventiler | cirka 70 % af Case A | 0 kr |

Affugteren giver også cirka 2.400 kWh varme om året, som radiatorerne ikke skal levere, så nettobesparelsen er mindre end bruttoen. **Elpatronen** er sandsynligvis den dyreste post i huset: kør efter, hvor mange timer den tænder (se `docs/heating-system.md`).

## 9. Hvad der driver tallene

1. **Hvor stor en del af de 25.000 kWh der er rumopvarmning.** Mit mid på 15.000 er et gæt. Hvis elpatronen er stor, er det lavere, men så er hver kWh varme dyrere.
2. **Andel af husets varme, de berørte rum dækker.** 40 % er et gæt.
3. **Hvor meget for varmt rummene ligger i dag** (Case A). Kælderen kender vi ikke.
4. **Peak shift** (mest usikre del af Case C).
5. **Batteriets levetid.**
6. **Prisen:** hver 10 % op løfter alle besparelser med 10 %.

## 10. Sådan gør vi tallene rigtige (måling i stedet for gæt)

1. **Varmepumpens energi** er driftstid × 3 kW og kan måles i HA (duty cycle). **Elpatron** kan registreres som en ekstra 1 kW pr. fase (afsnit i `docs/heating-system.md`).
2. **A/B-forsøg:** kør nattesænkning og skema til og fra på skiftende dage i to til fire uger. Sammenlign varmepumpens driftstid pr. døgn mod udetemperatur (graddage).
3. **Test en grad lavere** i stue og køkken i to uger, og se kWh pr. graddag.
4. **Kælderen:** mål med Timmerflotte i to uger, luk så to radiatorer i to uger. Mål affugteren med smart stikkontakt ved 50 % og derefter 60 %.
5. **Batteriet:** noter batteriprocent hver uge i 8 uger.
6. **Reflektorfolie:** på én radiator ved ydervæg, mål væggens overflade før og efter.
7. **Årsforbruget:** find, hvor meget af 2025's 25.000 kWh der var elpatron (fakturaens månedsværdier, vinter mod sommer giver et skøn).

## 11. Anbefaling

1. **Gratis først:** sæt dagmålet 1 °C ned, affugteren til 60 %, luk to kælderradiatorer, og planlæg smart ladning af bilen. Det er de største gevinster.
2. **Case C:** behold de LILJEBAGGE, I har (nu fire), og køb flere, hvis I vil have skema og overblik. Det betaler sig sandsynligvis, men afhænger af peak shift og batterierne. Beregn batteriudgiften efter 30 dage.
3. **Case B:** prøv 200 kr på én radiator ved en kold ydervæg. Fortsæt, hvis det ser ud til at virke og er pænt. Støbejern gør det mere interessant end ved panelradiatorer.
4. **Case A:** vent til kælder-målingerne og et tilbud fra VVS'eren på en billigere løsning. Køb kun, hvis rummene ligger over 3–4 °C for varmt, eller hvis I vil have komforten.
5. **Peak shift:** mål det, før I regner med det. Den er den største enkeltdel af Case C og den mest usikre.

## Åbne spørgsmål

- Hvor meget af 2025's forbrug var elpatron, og hvor meget var varmt brugsvand?
- Hvilken temperatur er der i kælderen i dag?
- Hvor mange af de fem ventiler er i kælderen, og hvor er den femte?
- Hvilke af radiatorerne sidder ved ydervæg (til Case B)?
- Hvad koster VVS'eren for kun indsats eller adapter?
