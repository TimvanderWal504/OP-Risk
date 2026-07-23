# Claude Design-prompts — Digitaal Risk

**Gebruik:** upload eerst `functioneel-ontwerp-risk.md` in Claude Design. Jij hebt Prompt 1 (TV), Prompt 3 (spelerstelefoon), Prompt 2 (host-uitbreiding) en Prompt 4 (Claim op de telefoon) al gedraaid. Plak Prompt 5 nu **in het bestaande TV-ontwerp** — het vult de ontbrekende live-claim-weergave aan die in Prompt 1 nog niet was meegenomen.

---

## Prompt 1 — Host-scherm (TV-bord)

```
Ontwerp het host-scherm van een digitaal Risk-bordspel in Jackbox-stijl. Het functioneel ontwerp is bijgevoegd; dit scherm is beschreven in §2.1. Het scherm is volledig passief: het toont het spel, er wordt niets op bediend. Alle input komt van de telefoons van spelers.

Kaders:
- Formaat 16:9, fullscreen op een TV, kijkafstand ~3 meter. Alles moet vanaf de bank leesbaar zijn: grote legeraantallen, dikke gebiedsranden, geen kleine tekst.
- Stijlrichting: strategische oorlogskamer — donker, campagnekaart-esthetiek, tactisch en licht theatraal. Geen kinderlijk bordspel-uiterlijk.
- 2 t/m 7 spelers. Ontwerp een set van 7 spelerskleuren die op de kaart duidelijk van elkaar te onderscheiden zijn, ook voor kleurenblinden (combineer kleur met een symbool of patroon per speler).
- De wereldkaart is de held van het scherm; alle overige UI (spelerslijst, feed, timer) blijft daaraan ondergeschikt.
- Grensverbindingen tussen gebieden: **landverbindingen als doorgetrokken lijn, zeeverbindingen als gestippelde lijn** — dit onderscheid komt direct uit de kaartdata (§4 van het FO) en moet dus consistent over de hele kaart toegepast worden, niet als eenmalig visueel accent op een paar plekken.

Ontwerp de volgende schermen/staten:

1. LOBBY — grote QR-code om te joinen, lijst van aangesloten spelers met gekozen kleur en naam, indicatie welke instellingen de host heeft gekozen (winconditie, gebeurtenisronde aan/uit).
2. VOLGORDE BEPALEN — alle spelers dobbelen; toon de worpen theatraal en de resulterende speelvolgorde.
3. HOOFDSPELSCHERM — wereldkaart met per gebied: eigenaarskleur + legeraantal. Vaste UI-elementen: wiens beurt (naam, kleur, actieve fase Versterken/Aanvallen/Verplaatsen), de beurttimer (3:00 aflopend, opvallend bij <30 sec; in de Verplaatsen-fase 1:00), spelerslijst met gebieden-/legertotalen, en een actie-feed die recente gebeurtenissen toont ("Rood legt 3 kaarten in: +8 legers", "Blauw valt Oekraïne aan vanuit Scandinavië").
4. GEBIEDSSELECTIE — de actieve speler kiest op zijn telefoon; op de TV lichten de op dat moment geldige gebieden op (bijv. alle gebieden van waaruit hij kan aanvallen, daarna de geldige doelwitten). Laat zien hoe highlight en dimming van de rest eruitzien.
5. GEVECHTSMOMENT — de aanvaller drukt "Gooi": dobbelstenen rollen zichtbaar het scherm in (aanvaller max 3, verdediger max 2, in spelerskleuren), daarna de uitkomst: welke legers sneuvelen, en bij verovering een duidelijke overname-animatiemoment van het gebied.
6. GEBEURTENISKAART — na een volledige ronde verschijnt theatraal een gebeurteniskaart (bijv. "Goede oogst: iedereen met een volledig continent krijgt +2 legers"). Toon ook hoe een ronde-lang actief effect ("Zeeverbindingen geblokkeerd") permanent in beeld blijft zolang het geldt — inclusief hoe de al gestippelde zeeverbindingen op de kaart er dan nog eens duidelijk anders uitzien (bijv. doorgestreept/roder) zodat spelers in één oogopslag zien welke routes tijdelijk niet bruikbaar zijn.
7. SPELER UITGESCHAKELD — kort, duidelijk moment op de TV wanneer een speler wordt uitgeschakeld; de spelerslijst toont hem daarna als uitgeschakeld. Toon ook hoe een speler op "auto-pass" wordt weergegeven.
8. WINNAAR — winnaarscherm met onthulling van alle geheime missies van alle spelers, en de status van de "Opnieuw spelen"-stemming (wie heeft al gestemd).

Maak het klikbaar zodat ik door de staten heen kan stappen.
```

---

## Prompt 2 — Host-schermen toevoegen aan de bestaande telefoon-flow

```
Je hebt in dit project al de spelerstelefoon-flow ontworpen (JOINEN, VOLGORDE DOBBELEN, STARTOPSTELLING, NIET AAN DE BEURT, VERSTERKEN, AANVALLEN, VEROVERING, VERDEDIGEN, VERPLAATSEN, UITGESCHAKELD, OPNIEUW VERBINDEN). Voeg daar nu de schermen aan toe die alléén de host te zien krijgt: het opzetten van een nieuw spel, en het herstarten na afloop. Zie §2.2 en §9 van het bijgevoegde functioneel ontwerp. Blijf in exact hetzelfde designsysteem, dezelfde componentstijl en dezelfde apparaatstijl (mobiel, portrait, duimbediening) als de rest van deze telefoon-flow — de host is functioneel gewoon een speler, met deze extra momenten ervoor en erna.

Kaders:
- Dit zijn geen losstaande schermen maar een uitbreiding van de bestaande flow: het nieuwe START-scherm hieronder komt vóór het bestaande JOINEN-scherm en verwijst ernaartoe; de WINNAAR-uitbreiding bouwt voort op het bestaande winnaar/UITGESCHAKELD-scherm in plaats van het te vervangen.
- De QR-code zelf staat op de TV, niet op de hosttelefoon — de host hoeft die niet aan zichzelf te tonen.
- Instellingen moeten in één scherm overzichtelijk zijn, ook al zijn het er acht; groepeer ze logisch (spelregels bovenaan, extra spelelementen als toggles onderaan).

Voeg de volgende schermen/staten toe:

1. START — nieuw allereerste scherm vóór JOINEN: twee grote keuzes, "Nieuw spel starten" en "Deelnemen aan een spel". Kiest iemand "Deelnemen", dan gaat de flow verder naar het bestaande JOINEN-scherm. Kiest iemand "Nieuw spel starten" (de host), dan naar staat 2 hieronder.
2. INSTELLINGEN — volledig instellingenscherm met: winconditie (Werelddominantie / Geheime missies — beide-tegelijk selecteerbaar), startopstelling (Random / Claimen), startlegers (getal, aanpasbaar per spelersaantal), beurttimer (standaard 3:00, aanpasbaar), en drie losse aan/uit-toggles onderaan als "Extra spelelementen": Rollen, Gebeurtenisronde, en ruimte voor toekomstige toggles. Duidelijke primaire knop "Spel aanmaken" onderaan, altijd zichtbaar (sticky).
3. WACHTEN OP SPELERS — na het aanmaken: een live bijgewerkte lijst van binnenkomende spelers (naam + gekozen kleur), een korte melding "QR-code staat op de TV", en een knop "Start spel" die uitgegrijsd is tot er minstens 2 spelers zijn en daarna oplicht.
4. SPELBEHEER-PANEEL — een discreet icoon/knop die tijdens het lopende spel (dus bovenop de bestaande VERSTERKEN/AANVALLEN/etc.-schermen) altijd bereikbaar is voor de host, en een beheerpaneel opent: lijst van alle spelers met per afwezige speler een schakelaar "Auto-pass aan/uit".
5. WINNAAR — HOST-UITBREIDING — bouw voort op het bestaande winnaarscherm (met de "Opnieuw spelen"-stemknop die alle spelers al zien) en voeg daar één extra, visueel duidelijk onderscheiden knop aan toe die alléén de host ziet: "Nieuw spel instellen". Deze knop gaat direct terug naar het instellingenscherm (staat 2, vooringevuld met de vorige keuzes) om met dezelfde deelnemers opnieuw te beginnen, zonder op de stemming van anderen te hoeven wachten.

Maak het klikbaar zodat ik de volledige flow START → (Deelnemen → bestaande JOINEN) of (Nieuw spel starten → INSTELLINGEN → WACHTEN OP SPELERS) kan doorlopen, én los daarvan WINNAAR → "Nieuw spel instellen" → terug naar INSTELLINGEN.
```

---

## Prompt 3 — Spelerstelefoon (controller)

```
Ontwerp nu, in hetzelfde designsysteem als het TV-bord en de host-schermen hierboven, de telefoon-controller van dezelfde digitale Risk voor een reguliere speler. Zie §2.2 en §2.3 van het bijgevoegde functioneel ontwerp. De telefoon is de enige plek waar een speler input geeft; kijken doet hij vooral naar de TV.

Kaders:
- Mobiel, portrait, duimbediening. Grote knoppen onderin bereik, geen priegelwerk.
- De telefoon toont uitsluitend geldige opties: gebiedsselectie is altijd een knoppenlijst van geldige keuzes ("Aanvallen vanuit Scandinavië naar: Oekraïne / IJsland / Noord-Europa"), nooit een kaart om op te tikken.
- Elke aanval en verplaatsing heeft een bevestigingsstap; bij aanvallen is de "Gooi"-knop de bevestiging.
- Drie tabs of secties die altijd bereikbaar zijn: Mijn kaarten (territoriumkaarten), Mijn missie (geheim), Spelinfo (wie heeft de meeste gebieden, continenten in bezit, legertotalen).
- De beurttimer van de actieve speler is ook op de eigen telefoon zichtbaar.

Ontwerp de volgende schermen/staten:

1. JOINEN — na het scannen van de QR: naam invoeren → kleur kiezen (bezette kleuren geblokkeerd) → wachten in de lobby.
2. VOLGORDE DOBBELEN — knop "Gooi" voor de volgordeworp, daarna je positie in de speelvolgorde.
3. STARTOPSTELLING — om beurten 1 leger plaatsen: knoppenlijst van je eigen gebieden, teller resterende startlegers.
4. NIET AAN DE BEURT — de staat waarin een speler ~85% van de tijd zit: wie is aan de beurt, compacte samenvatting van wat er gebeurt, en de drie tabs (kaarten/missie/spelinfo) prominent bruikbaar.
5. VERSTERKEN-FASE — toekenning van nieuwe legers (met uitleg van de opbouw: gebieden/continenten), kaarten inleggen (verplicht bij 5+ kaarten, met de escalerende waarde zichtbaar), legers verdelen over gebieden via knoppenlijst met plus/min.
6. AANVALLEN-FASE — stappenflow: kies herkomstgebied (knoppenlijst) → kies doelwit (knoppenlijst) → kies 1-3 dobbelstenen → "GOOI" als grote bevestigingsknop. Daarna: uitkomst kort op de telefoon (details staan op de TV), en de keuze "opnieuw aanvallen / ander gevecht / naar Verplaatsen".
7. VEROVERING — na het winnen van een gebied: kies hoeveel legers je meeverplaatst (minimum verplicht ingevuld), bevestig.
8. VERDEDIGEN — je wordt aangevallen terwijl je niet aan de beurt bent: prompt over het hele scherm "Blauw valt Oekraïne aan vanuit Scandinavië — verdedig met 1 of 2 dobbelstenen". Geen timer op deze keuze.
9. VERPLAATSEN-FASE — kies herkomst → kies bestemming (via verbonden pad van eigen gebieden) → aantal legers → "Bevestig verplaatsing". Timer staat hier op 1:00.
10. UITGESCHAKELD — volledig-scherm-melding "Je bent uitgeschakeld" die blijft staan zolang het spel loopt; zodra er een winnaar is verschijnt de knop "Opnieuw spelen" als stem.
11. OPNIEUW VERBINDEN — korte staat na verbindingsverlies: automatisch herstel, of naam invoeren bij een nieuw apparaat.

Maak het klikbaar zodat ik de volledige beurtflow (versterken → aanvallen → verdedigen vanuit een andere speler → verplaatsen) kan doorlopen.
```

---

## Prompt 4 — Claim-modus toevoegen aan de bestaande telefoon-flow

```
Je hebt in dit project de spelerstelefoon-flow al ontworpen, inclusief het scherm STARTOPSTELLING (om beurten 1 leger plaatsen op je eigen gebieden). Dat scherm dekt alleen de situatie ná de gebiedsverdeling. Voeg daar nu de ontbrekende stap vóór aan toe: bij de lobby-instelling "Startopstelling: Claimen" (i.p.v. Random, zie §5.1 en §10 van het functioneel ontwerp) kiezen spelers zelf, om de beurt, een leeg gebied — pas daarna volgt het bestaande STARTOPSTELLING-scherm. Blijf in exact hetzelfde designsysteem en dezelfde apparaatstijl als de rest van deze telefoon-flow.

Kaders:
- Dit is een nieuwe state tussen VOLGORDE DOBBELEN en STARTOPSTELLING in, alleen actief als de host "Claimen" heeft gekozen in de instellingen (anders slaat de flow deze state over, zoals nu al gebeurt).
- Net als bij elke andere gebiedsselectie in dit ontwerp: knoppenlijst, geen kaart om op te tikken. De lijst toont alleen nog vrije (niet-geclaimde) gebieden.
- Zodra alle 42 gebieden geclaimd zijn, gaat de flow automatisch door naar het bestaande STARTOPSTELLING-scherm (resterende legers bijplaatsen) — geen aparte bevestigingsstap nodig, het moment dat de lijst leeg is ís de overgang.

Voeg de volgende schermen/staten toe:

1. GEBIED CLAIMEN (eigen beurt) — knoppenlijst van alle nog vrije gebieden (bijv. gegroepeerd per continent zodat de lijst met 42 opties overzichtelijk blijft), teller "nog X gebieden te verdelen", duidelijke bevestiging per keuze.
2. GEBIED CLAIMEN (niet je beurt) — zelfde soort compacte "wachten"-staat als het bestaande NIET AAN DE BEURT-scherm: wiens beurt het is, en een live overzicht van wat al geclaimd is (bijv. simpele lijst "Rood: 4, Blauw: 3, Groen: 4..." of vergelijkbaar, af te stemmen op wat al in NIET AAN DE BEURT gebruikt wordt).

Maak het klikbaar zodat ik VOLGORDE DOBBELEN → GEBIED CLAIMEN (eigen beurt, een paar keer) → GEBIED CLAIMEN (niet je beurt) → automatische overgang naar STARTOPSTELLING kan doorlopen.
```

---

## Prompt 5 — Claim-fase zichtbaar maken op het TV-bord

```
Je hebt het TV-bord al ontworpen, met een sprong van VOLGORDE BEPALEN direct naar het HOOFDSPELSCHERM met een kant-en-klaar verdeelde kaart. Die sprong klopt alleen bij de lobby-instelling "Startopstelling: Random". Voeg de ontbrekende staat toe voor "Startopstelling: Claimen" (§5.1 en §10 van het functioneel ontwerp): spelers kiezen om de beurt een leeg gebied, en dat proces moet **live op de TV zichtbaar zijn** — wie heeft wat geclaimd, wie is er aan de beurt, hoeveel gebieden zijn nog vrij. Blijf in exact hetzelfde designsysteem als de rest van het TV-bord.

Kaders:
- Dit is een nieuwe staat tussen VOLGORDE BEPALEN en HOOFDSPELSCHERM in, alleen actief bij "Claimen"; bij "Random" verschijnt deze staat niet (de kaart verschijnt daar direct kant-en-klaar verdeeld op het HOOFDSPELSCHERM, zoals al ontworpen).
- De wereldkaart blijft de held van het scherm, net als overal — dit is geen apart lijstje-scherm maar de kaart zelf, live bijgewerkt.

Ontwerp de volgende staat:

1. GEBIEDEN CLAIMEN (TV) — de kaart toont elk gebied in de kleur van wie het al geclaimd heeft; nog-vrije gebieden zijn duidelijk neutraal/grijs/gedimd zodat in één oogopslag zichtbaar is wat nog open ligt. Vaste UI-elementen: wiens beurt het nu is (naam + kleur, zelfde stijl als de beurtindicatie op het HOOFDSPELSCHERM), een teller "X van 42 gebieden verdeeld", en een korte visuele bevestiging op het moment dat een speler claimt (bijv. het gebied "vlamt op" in zijn kleur, vergelijkbaar met het overname-moment bij verovering in staat 5). Zodra alle gebieden verdeeld zijn, schuift de staat automatisch door naar HOOFDSPELSCHERM (voor het bijplaatsen van de resterende startlegers).

Maak het klikbaar zodat ik VOLGORDE BEPALEN → GEBIEDEN CLAIMEN (een paar claims na elkaar, met wisselende beurt) → automatische overgang naar HOOFDSPELSCHERM kan doorlopen.
```

---

## Tips bij het itereren

- Beoordeel eerst het **hoofdspelscherm (TV)** en de **niet-aan-de-beurt-staat (telefoon)** — dat zijn de schermen waar iedereen het langst naar kijkt. Als die goed zijn, volgt de rest.
- Het instellingenscherm (Prompt 2, staat 2) is in de praktijk het scherm dat je het vaakst zult bijschaven naarmate je meer huisregels/toggles toevoegt (rollen, missies, events) — reken erop dat je hier later een refresh op doet.
- Vraag bij een tweede iteratie gericht per staat om aanpassingen ("maak de timer op de TV dominanter", "de knoppenlijst in stap 6 moet ook de legeraantallen van het doelwit tonen") in plaats van een volledige redo.
- Test het telefoonontwerp echt op je telefoon (Claude Design-prototypes zijn deelbaar via link) voordat je het als referentie voor de React-bouw vastlegt.

---

## Prompt 7 — Kleurkeuze + rolkeuze toevoegen aan het bestaande JOINEN-scherm

```
Je hebt de telefoon-flow en het TV-bord al ontworpen. JOINEN was oorspronkelijk
gespecificeerd als "naam invoeren -> kleur kiezen -> wachten in de lobby", maar
zowel de kleurkeuze-stap als een rolkeuze-stap zijn nooit gebouwd. Voeg beide
toe als vervolgstappen binnen JOINEN, vóór de wachten-in-de-lobby-staat. Blijf
in exact hetzelfde designsysteem en dezelfde apparaatstijl (mobiel, portrait,
duimbediening) als de rest van deze flow.

Volgorde binnen JOINEN: naam invoeren -> KLEUR KIEZEN -> ROL KIEZEN (alleen als
de host "Roltoewijzing: Kiezen" heeft ingesteld i.p.v. "Random", zie FO §8/§10)
-> wachten in de lobby.

Kaders:
- Beide keuzes werken volgens hetzelfde principe: eerst gekozen, is gekozen,
  op volgorde van joinen (niet op speelvolgorde -- die staat op dit moment nog
  niet vast). Al gekozen opties zijn zichtbaar geblokkeerd/uitgegrijsd en live
  bijgewerkt zodra een andere, sneller-joinende speler kiest.
- Bij lobby-instelling "Roltoewijzing: Random" wordt de ROL KIEZEN-stap
  overgeslagen -- de rol wordt dan stil door de server toegewezen, direct door
  naar wachten in de lobby, geen scherm nodig.
- Het rollen-grid toont per rol: naam en volledige omschrijving (inclusief
  effect en herkomstland) -- dit is een weloverwogen keuze, geen quick-pick,
  dus mag iets meer leesruimte per kaart hebben dan het kleurengrid.
- Het bestaande LOBBY-scherm op de TV (dat nu per speler naam + kleur toont)
  krijgt de gekozen rol erbij als derde kolom/label per speler, zodra
  Roltoewijzing op Kiezen staat -- geen nieuwe TV-staat nodig, een uitbreiding
  van de bestaande lijst.

Ontwerp de volgende schermen/staten:

1. KLEUR KIEZEN (telefoon) -- grid van 7 kleurstalen (kleur + naam +
   kleurenblind-symbool), bezette kleuren uitgegrijsd, live bijgewerkt.
2. ROL KIEZEN (telefoon) -- grid van nog beschikbare rollen, per rol naam +
   volledige omschrijving; reeds gekozen rollen uitgegrijsd/niet aantikbaar.

Maak het klikbaar zodat ik naam invoeren -> KLEUR KIEZEN -> ROL KIEZEN ->
wachten in de lobby kan doorlopen, en laat ook zien hoe het bestaande
LOBBY-scherm (TV) er met de extra rol-kolom uitziet.
```

---

## Prompt 8 — Roleffecten zichtbaar maken tijdens het spel (TV + telefoon)

```
Je hebt rollen al ontworpen als keuze- en lobby-moment: ROL KIEZEN op de
telefoon toont per rol naam + volledige omschrijving, en het TV-LOBBY-scherm
toont de gekozen rol als label per speler (Prompt 7). Wat nog ontbreekt is
hoe een roleffect zichtbaar wordt op het moment dat het er echt toe doet,
tijdens het lopende spel -- en of de boost op dat moment actief is. Een
roleffect werkt namelijk alleen zolang de speler zijn herkomstland bezit
(FO §8.1): "De TV toont per rol of de boost actief is (bijv. gekleurd/
uitgegrijsd icoon op het herkomstland)." Blijf in exact hetzelfde
designsysteem en dezelfde apparaatstijl (TV: donker, campagnekaart-esthetiek;
telefoon: mobiel, portrait, duimbediening) als de rest van dit ontwerp.

Er zijn vier roleffect-types (FO §8, data-driven uit roles.json). Drie
daarvan hebben nog geen visuele vertaling en moeten in dit ontwerp; het
vierde is al gedekt en dien je alleen als referentie te gebruiken:

- ExtraReinforcement (al gedekt, niet opnieuw ontwerpen): +N legers per
  beurt -- staat al als eenvoudig "+N"-badge in het bestaande ontwerp.
  Voorbeeldrollen: President (Oost-VS), Kolonist (Western Australia),
  Viking (Scandinavië), Tsaar (Ukraine).
- Reroll (nieuw): herwerp 1 verloren dobbelsteen per beurt. Voorbeeldrollen:
  Generaal (China), Admiraal (Oeral), Aboriginal (Eastern Australia),
  Samurai (Japan), Cowboy (Western United States), Maori (New Zealand).
- FortifyUpgrade (nieuw, twee varianten die visueel te onderscheiden moeten
  zijn): "throughEnemy" -- mag bij Verplaatsen een pad aanleggen door 1
  vijandelijk gebied heen (Safariranger, Congo); "moves" -- mag 2x
  verplaatsen in plaats van 1x per beurt (Smokkelaar, Noord-Afrika; Inca,
  Peru).
- CardTradeBonus (nieuw): +2 extra legers bij het inleveren van een
  kaartenset. Voorbeeldrollen: Diplomaat (Groot-Brittannië), Pharaoh
  (Egypte).

Kaders:
- Herkomstland-status is de kern van dit ontwerp: elk roleffect moet een
  duidelijk verschil tonen tussen "actief" (speler bezit het herkomstland)
  en "inactief" (verloren) -- gekleurd/opgelicht vs. uitgegrijsd, consistent
  met hoe uitgeschakelde spelers en geblokkeerde opties er elders in dit
  ontwerp al uitzien.
- Dit zijn geen nieuwe losstaande schermen maar uitbreidingen van bestaande
  staten: het HOOFDSPELSCHERM (TV) krijgt een roleffect-indicator per speler
  naast de al bestaande beurtindicatie; de betreffende telefoonschermen
  (AANVALLEN-FASE voor Reroll, VERPLAATSEN-FASE voor FortifyUpgrade,
  kaarten-inleggen in de VERSTERKEN-FASE voor CardTradeBonus) krijgen het
  effect zichtbaar op het moment dat de speler het kan gebruiken.
- Gebruik voor elk effect een icoon consistent met de bestaande rolsymbolen
  uit het rollen-grid (Prompt 7) -- geen nieuwe iconentaal ernaast.
- Reroll: toon een teller "nog X herworpen deze beurt/dit gevecht" tijdens
  het gevechtsmoment op de TV (staat 5 van Prompt 1) en op de telefoon in de
  AANVALLEN-FASE, plus de vervallen staat zodra de herworp al gebruikt is.
- FortifyUpgrade: toon in de VERPLAATSEN-FASE (telefoon) hoe de knoppenlijst
  of stappenflow verandert wanneer dit effect actief is -- bij
  "throughEnemy" een pad-optie door een vijandelijk gebied, bij "moves" de
  mogelijkheid een tweede verplaatsing te doen zonder de fase te verlaten.
- CardTradeBonus: toon bij het inleveren van een kaartenset (VERSTERKEN-FASE,
  telefoon) een opsplitsing "basiswaarde van de set + rol-bonus", zodat
  duidelijk is waar de extra legers vandaan komen.

Ontwerp de volgende uitbreidingen:

1. HOOFDSPELSCHERM (TV) -- ROLEFFECT-INDICATOR — bij elke speler in de
   spelerslijst een compact icoon voor zijn roleffect-type, gekleurd als
   actief / uitgegrijsd als inactief. Toon dit voor minstens 2 spelers
   tegelijk (één actief, één met verloren herkomstland) zodat het contrast
   duidelijk is.
2. AANVALLEN-FASE (telefoon + TV-gevechtsmoment) -- REROLL — hoe de
   herworp-optie verschijnt na een verloren dobbelsteen, met teller en
   vervallen staat.
3. VERPLAATSEN-FASE (telefoon) -- FORTIFYUPGRADE — beide varianten
   (pad-door-vijand en tweede verplaatsing) als los doorloopbare staten.
4. VERSTERKEN-FASE (telefoon) -- CARDTRADEBONUS — de kaarteninleg-uitkomst
   met basiswaarde + rol-bonus uitgesplitst.

Maak het klikbaar zodat ik het bestaande HOOFDSPELSCHERM met de nieuwe
roleffect-indicator kan bekijken, en vanuit de telefoon-flow de drie nieuwe
roleffect-momenten (Reroll, FortifyUpgrade x2, CardTradeBonus) na elkaar kan
doorlopen.
```
