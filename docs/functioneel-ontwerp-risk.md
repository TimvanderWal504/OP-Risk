# Functioneel Ontwerp — Digitaal Risk (Host + Telefoons)

**Versie:** 1.4 · **Datum:** 21 september 2026 · **Status:** Vastgesteld; rollen/missies/events inmiddels ook inhoudelijk ingevuld (zie §13); herwerp-stap en meervoudig Verplaatsen aangescherpt (§5.2, §5.3, §8.1)

---

## 1. Concept

Een digitale Risk-implementatie in Jackbox-stijl. Eén **host-scherm** (TV/groot scherm) toont passief het speelbord; elke speler bestuurt het spel via zijn **eigen telefoon**. De server (Azure App Service) is authoritative: alle spelregels, dobbelworpen en validaties gebeuren server-side.

- **Spelers:** 2 t/m 7
- **Sessies:** alleen live (geen opslaan/hervatten in v1)
- **Netwerk:** publiek bereikbaar via Azure App Service (API + SignalR) en Vercel (frontend), zie §12
- **Kaart, missies, rollen en gebeurtenissen:** volledig data-driven (JSON, zie §4 voor de kaart), zodat content zonder codewijziging kan worden toegevoegd of aangepast

---

## 2. Rollen & schermen

### 2.1 Host-scherm (TV) — passief bord

De host-TV heeft **geen** bedieningsfunctie (de wachttijden erop kan de host vanaf zijn telefoon doorklikken, zie **Verder op TV** in §2.2). Het toont:

- De wereldkaart met alle gebieden, kleuren per speler en legeraantallen
- Wiens beurt het is + actieve fase (Versterken / Aanvallen / Verplaatsen) + resterende beurttijd
- Alle uitgevoerde acties als visuele gebeurtenis: kaarteninleg, geplaatste legers, gestarte aanvallen, dobbelworpen (dobbelstenen "rollen het scherm in"), gevechtsuitkomsten, veroveringen, verplaatsingen
- Highlighting van geldige gebieden tijdens gebiedsselectie van de actieve speler (zie §2.3)
- Openbare rolinformatie van alle spelers (§8)
- Gebeurteniskaarten bij een gebeurtenisronde (§9.2)
- QR-code om te joinen (in de lobby)
- Vóór er een spel aan hangt: een koppel-QR-code om de TV aan een spel te koppelen (zie **TV koppelen** in §2.2)

### 2.2 Spelerstelefoon

De telefoon van de speler toont drie soorten informatie:

1. **Contextuele actieknoppen** — alleen de acties die de speler op dát moment mag doen: "Val aan" (+ onderliggende stappen), "Versterk" (+ onderliggende stappen), "Verplaats", "Beëindig beurt", "Leg kaarten in", "Gooi", dobbelsteenkeuze bij verdediging.
2. **Privé-informatie** — eigen territoriumkaarten en eigen geheime missie. Deze verschijnen nooit op de TV. Uitzondering: zie §6.2 voor de naam-onthulling tijdens een laatste-kans-venster (winconditie Geheime missies, timing-optie "Volle ronde met onthulling") — die onthult wie mogelijk wint, nooit de missie-inhoud zelf.
3. **Spelinformatie** — ranglijst/overzicht: wie heeft de meeste gebieden, welke continenten zijn in bezit en van wie, legertotalen. Staat de gebeurtenisronde aan (§9.2), dan toont de stand ook de laatst getrokken gebeurteniskaart (naam, omschrijving, duur) tot de volgende trekking — vóór de eerste trekking niets. Daarnaast het volledige spelverloop: elke openbare actie van het spel, nieuwste bovenaan (de TV toont alleen de laatste paar).

De host is functioneel gewoon een speler met een telefoon, met als enige extra bevoegdheden: spel opzetten (lobby, instellingen §10), spel starten, een afwezige speler op auto-pass zetten (§11.2), "Verder op TV" (hieronder), en na afloop direct een nieuw spel opzetten (§7). Het host-schap is niet vast: valt de host tijdens het spel weg, dan gaat het over naar een andere speler (§11.1).

**Verder op TV:** de TV houdt sommige uitkomsten even vast voordat hij verder gaat: de uitslag van de beurtvolgorde (5 s), een afgehandeld gevecht (5 s) en een getrokken gebeurteniskaart (8 s, §9.2). De host kan die wachttijd doorklikken met **"Verder op TV"**: een vaste actie in zijn telefoonheader, en op het beurtvolgordescherm (dat geen header heeft) een knop die alleen verschijnt zolang de uitslag nog vastgehouden wordt. Het klikt ook de beurtvolgorde-uitslag op de telefoons van alle spelers door. Het is puur presentatie: het spel zelf verandert niet, er wordt niets vastgelegd, en een lopend gevecht of een openstaande keuze (zoals legers verwijderen bij een gebeurtenis) wordt niet overgeslagen. Houdt de TV niets vast, dan gebeurt er niets.

**Host-opzetflow (vóór de lobby):** de host opent dezelfde app als elke speler, maar kiest bij het openen "Nieuw spel starten" in plaats van "Deelnemen aan spel". Dit leidt naar het instellingenscherm (§10); pas na bevestiging daarvan wordt de lobby aangemaakt en verschijnt de QR-code op de TV. Dit en de koppelstap hieronder zijn de enige plekken waar de host een ander scherm ziet dan een reguliere speler vóór de lobby.

**TV koppelen:** op het openingsscherm staat naast "Nieuw spel starten" en "Deelnemen aan spel" de keuze **"TV koppelen"**, bedoeld voor het apparaat dat als TV gaat dienen. Dat apparaat toont dan een koppel-QR-code met de bijbehorende koppelcode. De telefoon die de QR scant, wordt de host: hij komt direct op het instellingenscherm (§10), en zodra de host daar het spel aanmaakt, gaat de spelcode automatisch naar de gekoppelde TV en komt de host in zijn lobby. Lukt scannen niet, dan kiest de host op het openingsscherm **"Code van de TV invoeren"**, typt de koppelcode over en komt op hetzelfde instellingenscherm. Lukt het versturen naar de TV niet, dan is het spel wel aangemaakt: de host kan het opnieuw proberen of alvast naar zijn lobby.

Zodra de TV een spelcode ontvangt, toont hij dat spel (de lobby met join-QR, of het lopende spel). Een koppelcode is eenmalig bruikbaar en vervalt zodra de TV de verbinding verliest; de TV vraagt dan zelf een nieuwe aan. Koppelen is geen spelregel en verandert niets aan de spelstate — het bepaalt alleen welk spel de TV toont. Handmatig naar het TV-adres van een spel navigeren blijft mogelijk.

### 2.3 Gebiedsselectie (hybride)

Bij elke actie die een gebied vereist:

- De **TV highlight** de op dat moment geldige gebieden (bijv. alle gebieden van waaruit de speler kan aanvallen; daarna alle geldige doelwitten vanuit het gekozen gebied).
- De **telefoon** toont dezelfde geldige opties als knoppenlijst ("Aanvallen vanuit Scandinavië naar: Oekraïne / IJsland / Noord-Europa").
- Ongeldige opties worden nooit getoond; de server valideert desondanks elke ingezonden actie opnieuw.

---

## 3. Toegang & identiteit

- **Joinen**: QR-code scannen op het host-scherm → naam invoeren → kleur kiezen (bezette kleuren geblokkeerd, live bijgewerkt zodra iemand anders kiest) → (indien Roltoewijzing = Kiezen, §8/§10) rol kiezen (bezette rollen geblokkeerd, live bijgewerkt zodra iemand anders kiest) → wachten in de lobby.
- **Sessieherstel:** token in localStorage. Bij terugkeer op hetzelfde apparaat wordt de speler automatisch herkoppeld. Bij een **ander apparaat** voert de speler zijn naam in; de server koppelt hem aan de bestaande spelerspositie (en invalideert het oude token).
- **Speelvolgorde:** bepaald door dobbelen bij de spelstart met **2 dobbelstenen** (kleinere kans op gelijkspel), zichtbaar op de TV. Hoogste totaal begint; bij gelijke hoogste worp gooien **alleen de gelijken** opnieuw.

---

## 4. Kaartdata-model (territoria, continenten & zeeverbindingen)

De kaart zelf is, net als missies/rollen/gebeurtenissen, volledig **data-driven**: één JSON-bestand beschrijft alle territoria, continenten en de verbindingen ertussen. Dit is bewust zo opgezet zodat de 50+ gebieden-variant (eerder besproken) of een compleet andere kaart later kan zonder dat er één regel spellogica of rendercode verandert.

### 4.1 Territoria, continenten & echte landvormen — twee-lagen model

De kaart is opgebouwd uit **twee gescheiden lagen**, specifiek zodat uitbreiden naar meer/andere gebieden nooit een nieuwe geodata-pull vereist, alleen een configuratiewijziging:

**Laag 1 — atomaire regio's** (de kleinst mogelijke geografische bouwstenen, uit publiek-domein Natural Earth-data): voor de meeste landen is dit één land (ISO A3-code, bijv. `"FRA"`, `"EGY"`, `"NZL"`, `"CHL"`); voor de landen die intern gesplitst worden of later gesplitst kunnen worden (Rusland, VS, Canada, Australië, en als bonus alvast China, Brazilië, India, Indonesië, Zuid-Afrika) is dit een deelstaat/provincie (ISO 3166-2-code, bijv. `"RU-TOM"`, `"US-CA"`, `"AU-WA"`).

**Laag 2 — groeperingsconfiguratie** (`territories.json`): welke atomaire regio's samen één Risk-gebied vormen:

```json
{
  "id": "western-europe", "name": "Western Europe", "continent": "europe",
  "atomicRegions": ["FRA", "ESP", "PRT"]
}
```

Een generatiescript (`build_map.py`) neemt beide lagen, **unieert** (dissolve) de atomaire geometrieën per gebied tot één polygon, en berekent het middelpunt (centroid) voor labels/legerteller-plaatsing. Dit is al daadwerkelijk gebouwd en getest: alle 42 klassieke gebieden zijn zo opnieuw opgebouwd uit echte kustlijnen (zie `territories_preview.png`), inclusief correctie van de fouten uit de eerder gegenereerde AI-afbeelding (IJsland, Egypte en Irkutsk zijn nu correct aanwezig; de dubbele "Middle East" en het extra "New Zealand"-gebied zijn niet meer een AI-gok maar een bewuste, correcte keuze).

**Waarom dit uitbreidbaar is:** een gebied toevoegen of splitsen is uitsluitend een wijziging in de groeperingsconfiguratie, nooit in de rendercode:
- **Nieuw-Zeeland toevoegen:** `NZL` is al een eigen atomaire regio (gewoon een land) — één nieuwe entry `{ "id": "new-zealand", "atomicRegions": ["NZL"], ... }` volstaat.
- **Chili loskoppelen van Peru:** `CHL` zat als atomaire regio in de `peru`-groep; hem eruit halen en een eigen `chile`-entry aanmaken splitst het gebied, zonder dat er iets aan Peru's overige vorm verandert.
- **Meer landen in Afrika:** elk Afrikaans land is al een losse atomaire regio binnen de huidige "Congo"/"East Africa"/"North Africa"-mega-groepen — die er één voor één uit splitsen naar een eigen gebied is dezelfde ingreep als bij Chili.
- **Rusland/VS/Canada/Australië nog verder opdelen** dan de huidige klassieke indeling kan ook, omdat laag 1 daar al op deelstaat-niveau zit — geen nieuwe data nodig, alleen een andere indeling in laag 2.

Dit is bewezen door de generator ook daadwerkelijk te draaien met Nieuw-Zeeland + een losgekoppeld Chili: resultaat 44 correct gevormde gebieden zonder wijziging aan het script zelf (zie `territories_extended_preview.png`).

**Output voor de game:** het generatiescript schrijft `territories.geo.json` — per gebied de geünieerde polygon-geometrie, klaar om als SVG-`<path>` te renderen en te gebruiken voor klik-detectie in de UI. Optimalisatie voor later: de brondata (50m-resolutie) geeft vrij gedetailleerde/zware paths (~1,8MB voor 42 gebieden); voor productie is geometrie-vereenvoudiging (bijv. Douglas-Peucker via Shapely's `simplify()`, of een lagere Natural Earth-resolutie zoals 110m) een verstandige vervolgstap om de payload te verkleinen zonder dat het er op TV-formaat anders uitziet.

### 4.2 Zeeverbindingen — data-driven, gevalideerd tegen de echte geometrie

Elke verbinding tussen twee territoria is een eigen record met een expliciet **type**, in plaats van een simpele lijst van buren:

```json
{
  "borders": [
    { "from": "alaska", "to": "kamchatka", "type": "sea" },
    { "from": "scandinavia", "to": "ukraine", "type": "land" },
    { "from": "southern-europe", "to": "middle-east", "type": "land" }
  ]
}
```

Dit lost twee dingen in één keer op:
- **Aanvals-/verplaatsingslogica** hoeft geen onderscheid te maken — beide types gelden gewoon als "aangrenzend" voor de rules engine, tenzij een gebeurtenis (zie hieronder) dat tijdelijk blokkeert.
- **Het `SeaRoutesBlocked`-effect (§9.2)** kan hierdoor puur data-driven werken: de server filtert bij het bepalen van geldige aanvallen/verplaatsingen simpelweg alle `borders` met `type: "sea"` eruit zolang het effect actief is. Er hoeft dus **geen aparte, apart te onderhouden lijst van zeeverbindingen** te bestaan — dezelfde bron van waarheid wordt op twee plekken gebruikt (kaartweergave én effect-logica).

Deze laag staat volledig los van de geometrie in §4.1: welke twee gebieden aan elkaar grenzen (en of dat land of zee is) blijft een bewuste spelontwerpkeuze, niet iets dat automatisch uit "raken de polygonen elkaar" wordt afgeleid — dat zou bijvoorbeeld de klassieke Alaska-Kamchatka zeeroute missen, want die landmassa's raken elkaar geometrisch niet.

**Validatie tegen `territories.geo.json` (afgerond, incl. review-beslissingen):** de definitieve lijst (86 verbindingen: 61 land + 25 zee, `adjacency_validated.json`) is consistent met de polygon-geometrie: **elke land-verbinding raakt ook daadwerkelijk geometrisch, en er bestaan geen rakende gebiedsparen die buiten de lijst vallen** (geautomatiseerd geverifieerd) — met één bewuste uitzondering, `eastern-united-states–central-america` (zie de herziening van 2026-09-26 hieronder). De belangrijkste beslissingen die hierin verwerkt zijn:
- **Kaukasus-gat gedicht:** Georgië, Armenië en Azerbeidzjan zijn aan `ukraine` toegewezen, waardoor de klassieke `middle-east–ukraine`-verbinding ook geometrisch klopt.
- **Yukon hergegroepeerd** naar `northwest-territory`, waardoor de klassieke `alaska–northwest-territory`-verbinding hersteld is.
- **Rusland-banden herzien** naar de klassieke lay-out (Siberië als verticale band die Mongolië en China raakt; Irkutsk/Yakutsk oostelijker).
- **Bewust geaccepteerde afwijkingen van klassiek Risk** (precieze geografie wint): `north-africa–east-africa`, `ural–china` en `mongolia–kamchatka` bestaan niet meer; nieuw zijn o.a. `quebec–northwest-territory`, `irkutsk–china`, `congo–egypt` en `afghanistan–siberia`.
- **Nieuw-Zeeland toegevoegd als 43e gebied** (continent Australië, atomaire regio `NZL`) met twee zeeverbindingen: `new-zealand–eastern-australia` en `new-zealand–peru` (tot 2026-09-26 `new-zealand–argentina`). Die laatste is een bewuste spelontwerpkeuze zonder klassiek precedent: ze geeft Australië een tweede toegangspunt van buitenaf (naast `siam–indonesia`) en verbindt het continent rechtstreeks met Zuid-Amerika. De continentbonus van Australië is daarop aangepast (§4.4).
- **Herziening 2026-09-26 (besluit gebruiker):** `mongolia–japan` (zee) is vervangen door twee zeeverbindingen, `irkutsk–japan` en `china–japan`; `eastern-united-states–central-america` is als landverbinding teruggezet, hoewel de polygonen elkaar niet raken (ca. 1,35° uit elkaar) — hier wint het klassieke spelbord van de precieze geografie; en de zeeroute van Nieuw-Zeeland naar Zuid-Amerika landt op `peru` in plaats van `argentina`.
- Alle 43 gebieden blijven onderling verbonden (volledige graaf).

### 4.3 Genereren op het beeld (TV)

Met echte polygonen (§4.1) in plaats van simpele punten wordt de TV-weergave nog steeds volledig **gegenereerd**, alleen nu op basis van échte kustlijn-vormen in plaats van abstracte nodes:

- Elk territorium wordt een `<path>` uit `territories.geo.json`, gekleurd naar de huidige eigenaar.
- Elke `border`-entry (§4.2) met `type: "sea"` wordt een **gestippelde** verbindingslijn tussen de centroids van de twee betrokken gebieden; de lijn stopt aan de rand van de legerschijf in plaats van erdoorheen te lopen. **Landgrenzen krijgen geen lijn** (besloten 2026-09-25): aangrenzende gebieden raken elkaar op de kaart al zichtbaar, en 61 extra lijnen voegen alleen ruis toe. Het `type`-veld bepaalt dus of er een lijn komt, niet welke stijl.
- **Zeeroutes over de datumgrens** (Alaska–Kamchatka, Nieuw-Zeeland–Peru) worden twee stompjes: vanaf elk van beide gebieden een lijn naar de kaartrand waar de partner "achter" ligt, zoals op een klassiek Risk-bord. Dit wordt afgeleid uit de geometrie, niet uit de data: een zeeroute waarvan de twee centroids meer dan een halve wereldomtrek (180°) uit elkaar liggen, geldt als route over de datumgrens. Een bewust lange route die juist *over* de kaart getekend moet worden, is met deze regel niet uit te drukken — bij een toekomstige kaartvariant die dat nodig heeft, hoort daar een expliciet veld in `adjacency_validated.json` bij.
- Een nieuw gebied toevoegen (zoals hierboven aangetoond met Nieuw-Zeeland/Chili) vereist geen nieuwe illustratie — alleen een configuratiewijziging plus het herdraaien van het generatiescript.

### 4.4 Overige speldata (continenten, kleuren, kaartendeck)

Drie aanvullende databestanden completeren de spel-dataset:

- **`continents.json`** — de continentbonussen: NA 5, ZA 2, EU 5, AF 3, AZ 7, **AU 3**. De eerste vijf zijn de klassieke waarden; Australië is verhoogd van 2 naar 3 omdat het continent met Nieuw-Zeeland op 5 gebieden en 2 toegangspunten komt (§4.2). Bij verdere uitbreiding van de kaart worden de bonussen per continent herzien op basis van het nieuwe aantal gebieden en toegangspunten (vuistregel: bonus ≈ aantal gebieden / 2, +1 voor moeilijk verdedigbare continenten).
- **`colors.json`** — de 7 spelerskleuren uit het Claude Design-ontwerp: Rood `#C0392B`, Blauw `#215C9C`, Groen `#4F7A2E`, Geel `#E0A81C`, Paars `#8E4585`, Oranje `#D97A1A`, Turquoise `#158F8A`, elk met een kleurenblind-vriendelijk symbool. Missies verwijzen naar deze kleur-ID's.
- **`cards.json`** — de **regels** van het territoriumkaarten-deck, niet het deck zelf. Het deck wordt door de rules engine **afgeleid** uit de gebieden van de actieve kaartvariant: één kaart per gebied, alfabetisch op `territoryId` met de symbolen cyclisch verdeeld, plus het aantal jokers uit `deck.jokerCount`. Voor de standaard-43-kaart geeft dat 43 gebiedskaarten + 2 jokers = 45, met symboolverdeling 15/14/14 (43 is niet deelbaar door 3, dus één symbool krijgt er één extra). Reden voor afleiden in plaats van opsommen: een kaartvariant kan zo geen deck hebben dat niet bij zijn eigen gebieden past, en een gebied toevoegen vereist geen tweede handmatige wijziging. Het bestand bevat wél `deck.symbols` en `deck.jokerCount` (zodat aantallen niet in code staan) en de set-regels. Symbolen zijn thema-neutrale ID's met twee weergavethema's: **klassiek** (Infanterie / Cavalerie / Artillerie) en **modern** (Infanterie / Pantser / Drone). Geldige sets: 3× hetzelfde symbool of 1 van elk; een joker vervangt elk symbool. Het deck bevat ook de regel **`ownedTerritoryBonus: 2`**: leg je een kaart in van een gebied dat je op dat moment bezit, dan plaats je direct 2 extra legers op dat gebied (klassieke regel; per spel aanpasbaar in de data). **Lege trekstapel:** is de trekstapel leeg op het moment dat een kaart getrokken moet worden, dan wordt de aflegstapel geschud tot de nieuwe trekstapel (klassiek); dit kan zich pas voordoen nadat het deck een aantal ronden heeft gedraaid. **Weergavethema:** staat vandaag vast op `classic`; het is de bedoeling dat dit een lobby-instelling wordt (§10), maar dat is nog niet gebouwd.

---

## 5. Spelverloop

### 5.1 Startopstelling

Twee modi, instelbaar in de lobby (§10). **Standaard: random verdeeld.**

- **Random (standaard):** de server verdeelt alle gebieden gelijkmatig willekeurig; daarna plaatsen spelers **om de beurt** hun resterende startlegers bij, klassiek in de vaste beurtvolgorde, totdat alle legers geplaatst zijn.
- **Claimen:** spelers claimen **om beurten** één leeg gebied tot alles verdeeld is; daarna plaatsen spelers **om de beurt** hun resterende startlegers bij, in dezelfde volgorde, totdat alle legers geplaatst zijn.

**Startlegers:** klassieke tabel per spelersaantal — 40/35/30/25/20 voor 2–6 spelers, 18 bij 7. De host kiest in de lobby een **preset** (Klassiek, Modern, Klassiek-49) in plaats van een los getal; het exacte aantal per speler volgt uit de gekozen preset zodra het definitieve spelersaantal bekend is (bij het starten van het spel, niet bij het aanmaken).

**Rolrestrictie bij verdeling:** een speler mag zijn eigen rol-herkomstland niet in startbezit krijgen (§8).

### 5.2 Beurtstructuur

Klassiek: **Versterken → Aanvallen → Verplaatsen (Fortify)**.

- **Versterken:** legers = max(3, ⌊eigen gebieden / 3⌋) + continentbonussen + rolbonussen + eventuele kaarteninleg.
- **Kaarteninleg:** klassiek escalerend (4, 6, 8, 10, 12, 15, daarna telkens +5). Inleg bij 5+ kaarten verplicht aan het begin van de versterkingsfase. Deck, geldige sets, jokers en de +2-bezitsbonus staan in `cards.json` (§4.4). Na elke beurt waarin de speler minstens één gebied veroverde, trekt hij 1 kaart. Een speler mag in één versterkingsfase **meerdere sets** achter elkaar inleveren; er is geen maximum.
- **Verplichting bij een verlopen timer:** loopt de beurttimer af terwijl een speler nog moet inleggen (5+ kaarten), dan vervalt die verplichting niet — hij schuift door naar het begin van de volgende beurt van die speler. De server legt niet automatisch een set in. Enige uitzondering: een speler op auto-pass (§11.2), voor wie de server bij zijn automatische beurt de verplichte inleg wél doet. Een beurt die wordt afgebroken omdat de speler op auto-pass gaat, volgt wel deze timer-regel.
- **Aanvallen:** onbeperkt aantal aanvallen. Aanvaller kiest per worp 1–3 dobbelstenen, verdediger kiest 1–2 (§5.3). Na verovering verplicht minimaal zoveel legers meeverplaatsen als gebruikte aanvalsdobbelstenen.
- **Verplaatsen:** de **moderne variant** — één verplaatsing over een aaneengesloten pad van eigen gebieden (niet beperkt tot directe buren). **Kernregel:** in het brongebied moet minimaal 1 leger achterblijven. Een actieve `FortifyUpgrade`-rol met `moves` (§8.1) geeft dat aantal verplaatsingen in plaats van één, allemaal binnen dezelfde Verplaatsen-timer (§10); er gelden geen extra restricties op bron- of doelgebied van de tweede verplaatsing (dezelfde gebieden mogen opnieuw).

### 5.3 Gevechten & dobbelen

1. Aanvaller kiest herkomst- en doelgebied (hybride selectie §2.3) en het aantal dobbelstenen. **Kernregel:** aanvallen kan alleen vanuit een gebied met minimaal 2 legers, en het aantal aanvalsdobbelstenen is maximaal (legers in het brongebied − 1), met een absoluut maximum van 3.
2. Aanvaller drukt **"Gooi"** — dit is tegelijk de bevestiging van de aanval (§5.5). De server gooit meteen de aanvalsdobbelstenen, zichtbaar op TV.
3. Heeft de aanvaller een actieve `Reroll`-rol (§8) en is de herwerp voor dit doelgebied deze beurt nog niet gebruikt, dan krijgt hij een **expliciete herwerp-stap**: hij kiest zelf één van zijn eigen dobbelstenen om te herwerpen, óf kiest "Doorgaan" zonder herwerp. De verdediger kan pas kiezen (stap 4) nadat de aanvaller deze stap heeft afgerond; zijn telefoon toont ondertussen dat de aanvaller een herwerp overweegt. Dit is dus altijd vóór enige vergelijking met de verdediger. Is er geen actieve `Reroll`-rol of is de herwerp voor dit doelgebied al gebruikt, dan is er geen stap en gaat het direct door naar stap 4.
4. De verdediger krijgt op zijn telefoon de keuze: verdedigen met 1 of 2 dobbelstenen — binnen de grenzen van de lobby-instelling **Dobbelregel** (§10). **Harde regel (beide varianten):** een verdediger met slechts 1 leger in het gebied kan alleen 1 dobbelsteen kiezen (de UI toont dan geen keuze). **Huisregel (standaard, wijkt af van de officiële Risk-regels):** gooit de aanvaller met 1 dobbelsteen, dan moet de verdediger ook met 1 verdedigen — tenzij hij een actieve `DefenseBoost`-rol heeft (§8.1) die hij deze ronde nog niet heeft ingezet; in dat geval kan hij kiezen om de boost in te zetten en alsnog met 2 te verdedigen. De boost is eenmalig per ronde per speler en wordt weer beschikbaar aan het begin van de eigen volgende beurt van de rolhouder. **Klassiek:** de verdediger mag altijd met 2 gooien vanaf 2 legers, ongeacht het aantal aanvalsdobbelstenen (officiële Risk-regel); `DefenseBoost`-rollen hebben in deze stand geen functie en zitten niet in de rolpool (§10). **De verdediger heeft geen timer.** Staat de verdediger op auto-pass (§11.2), dan kiest de server direct het maximum dat de gewone regels toestaan; een `DefenseBoost` zet de server nooit in.
5. De server gooit de verdedigingsdobbelstenen, zichtbaar op TV. Uitkomst (verliezen per kant) wordt bepaald door de (eventueel herworpen) aanvalsworp tegen de verdedigingsworp te vergelijken, en op de TV getoond en verwerkt.
6. Bij verovering: aanvaller kiest hoeveel legers hij meeverplaatst (minimaal het aantal gebruikte aanvalsdobbelstenen).

### 5.4 Beurttimer

- **Harde timer van standaard 3 minuten** voor de fases Versterken + Aanvallen, zichtbaar op de TV. Eén doorlopende timer over beide fases, niet per fase.
- De timer **pauzeert** zodra de aanvaller "Gooi" drukt tegen een doelgebied, en blijft gepauzeerd voor de volledige belegering van dát gebied — ook over meerdere achtereenvolgende worpen heen (verliest de aanvaller een worp zonder het gebied te veroveren, dan telt een hernieuwde "Gooi" tegen hetzelfde doelgebied niet als een nieuw gevecht). De timer loopt weer zodra: (a) de aanvaller het gebied verovert en de meeverplaatsing bevestigt, (b) de aanvaller na een afgeslagen worp op "Ander gevecht" drukt — dat is het handmatig opgeven van de huidige belegering, ook als er nog geen nieuw doelgebied gekozen is — of (c) de aanvaller alsnog een aanval op een ánder doelgebied aankondigt terwijl de timer nog bevroren stond van de vorige belegering. Uitgevoerde acties tegen hetzelfde doelgebied kosten de aanvaller dus geen beurttijd; het moment waarop hij de belegering verlaat (via "Ander gevecht" of een nieuwe "Gooi" tegen een ander gebied) telt weer mee.
- **Bij aflopen van de timer** springt de beurt naar de Verplaatsen-fase.
- **Bij het ingaan van de Verplaatsen-fase** (via timeout óf regulier) wordt de timer altijd op de Verplaatsen-timer gezet, standaard **1 minuut**. Loopt die af, dan eindigt de beurt (zonder verplaatsing indien niet bevestigd).
- **Niet-geplaatste legers vervallen** bij het aflopen van de Versterken/Aanvallen-timer: een versterkingspool of kaarteninleg-opbrengst die de speler nog niet over zijn gebieden verdeeld heeft, gaat verloren zodra de beurt naar Verplaatsen springt. **Eén uitzondering:** een kaarteninleg van déze beurt waarvan de volledige setwaarde nog binnen de onbenutte rest van de pool valt, wordt teruggedraaid in plaats van vervallen — de ingeleverde kaarten gaan terug naar de hand van de speler (en tellen dus weer mee voor de volgende 5+-verplichting), de inlegwaarde-escalatie wordt teruggezet naar de waarde van vóór die inleg, en een eventuele bezitsbonus wordt van het betreffende gebied afgehaald. Bij meerdere inlegs in dezelfde fase wordt de onbenutte rest eerst aan de laatst ingeleverde set toegerekend, dan aan de voorlaatste, enzovoort; de oorspronkelijke versterkingspool (niet uit een kaartenset afkomstig) vervalt altijd als laatste.
- Beide timers zijn **lobby-instelbaar** (§10).

### 5.5 Bevestigen

- Elke aanval en elke verplaatsing kent een expliciete bevestigingsstap.
- Voor aanvallen **is de "Gooi"-knop de bevestiging** (geen aparte extra stap).
- Voor de verplaatsing aan het einde van de beurt: selectie → aantal → knop "Bevestig verplaatsing".

---

## 6. Wincondities

Beide modi bestaan; instelbaar in de lobby.

- **Werelddominantie:** verover alle gebieden.
- **Geheime missies:** iedere speler krijgt bij de start een geheime missie (alleen zichtbaar op eigen telefoon). Werelddominantie geldt altijd als impliciete winconditie.

### 6.1 Missies — data-driven

Missies staan in JSON en zijn zelf uit te breiden. Ondersteunde missietypes (rules engine):

| Type | Parameters | Voorbeeld |
|---|---|---|
| `TerritoryCount` | `count` | Bezit 24 gebieden |
| `TerritoryCountMinArmies` | `count`, `minArmies` | Bezit 18 gebieden met elk ≥ 2 legers |
| `ConquerContinents` | `continents[]`, `extraAnyContinent` | Verover Europa + Australië + 1 naar keuze |
| `EliminatePlayer` | `targetColor` | Schakel Geel uit |
| `WorldDomination` | — | Verover alles |

Elk missietype kent daarnaast een optioneel, missie-breed veld `minPlayers`: het minimale
spelersaantal waarbij de missie mag worden toegewezen. Ontbreekt het veld, dan geldt geen
minimum. `territory-18-min2` ("Bezit 18 gebieden met elk ≥ 2 legers") heeft `minPlayers: 4`,
`territory-24` heeft `minPlayers: 3`: bij een lager spelersaantal worden ze niet toegewezen.

```json
{
  "id": "eliminate-yellow",
  "type": "EliminatePlayer",
  "params": { "targetColor": "yellow" },
  "name": "Schakel de gele speler uit",
  "description": "Vernietig alle legers van de gele speler."
}
```

**Wanneer worden missies gecontroleerd?** De server controleert de missievoorwaarden **na elke beurt** — dus ook wanneer jouw missie vervuld raakt door de actie van een ander (bijv. jouw doelwit wordt door een derde uitgeschakeld op het moment dat jij al aan de fallback-voorwaarde voldoet). Uitzondering: missies met het veld `requiresOwnTurn: true` worden alléén gehonoreerd aan het einde van de eigen beurt van de missiehouder; dit veld wordt altijd gerespecteerd. De automatische beurt van een speler op auto-pass (§11.2) telt ook als "een beurt": aan het einde ervan worden de missies van alle andere spelers gecontroleerd, maar het is geen eigen beurt van de auto-pass-speler — zijn `requiresOwnTurn`-missie wordt daar dus niet gehonoreerd. Andere missies van een auto-pass-speler kunnen wel vervuld raken, bij het beurteinde van een ander. Zie §6.2 voor het onderscheid tussen direct beslissende en laatste-kans-missies — dat onderscheid komt bovenop de `requiresOwnTurn`-regel hierboven, niet in plaats ervan.

Regels rond `EliminatePlayer`:
- Is het doelwit de speler zelf (eigen kleur) of doet die kleur niet mee → direct een fallback-missie.
- Wordt het doelwit door een **andere** speler uitgeschakeld → speler krijgt automatisch een fallback-missie (melding op eigen telefoon, niet op TV).
- Een fallback-missie is geen vast, per `EliminatePlayer`-missie ingesteld doel: de server kiest
  zelf willekeurig een nog niet in dit spel gebruikte `ConquerContinents`-missie ("deze kunnen
  altijd", ongeacht spelersaantal). Zo krijgt geen twee spelers ooit dezelfde fallback-missie —
  ook niet wanneer meerdere spelers tegelijk (via de trekking of via een latere herwijzing) op de
  fallback-route terechtkomen.
- Bij 7 spelers moet de missieset dekkend zijn voor 7 kleuren; de set wordt bij de start gevalideerd (server weigert een start met inconsistente missiedata). Diezelfde validatie eist minstens één `ConquerContinents`-missie, anders bestaat er nooit een fallback-categorie.

### 6.2 Timing van missie-overwinningen

Instelbaar in de lobby (§10), naast de winconditie zelf — alleen relevant bij winconditie Geheime missies. Drie varianten:

1. **Einde van je beurt (standaard).** Zoals hierboven beschreven: vervul je de missie, dan eindigt het spel meteen.
2. **Begin van je volgende beurt.** Elke andere, nog niet uitgeschakelde speler krijgt eerst nog exact één beurt ("laatste kans"), in de normale beurtvolgorde, voordat de overwinning definitief is. Blijft de missie na al die beurten nog steeds vervuld, dan wint de missiehouder alsnog — dit gebeurt mechanisch op het moment dat de laatste van die beurten eindigt (dat is gelijk aan "bij het begin van je volgende beurt": de overwinning wordt vastgesteld bij het einde van die laatste beurt, vóór een eventuele gebeurtenisronde — een gewonnen spel trekt geen gebeurteniskaart meer, §9.2). Het enige dat het bord tússen twee beurten kan veranderen is een `ArmyAttrition`-gebeurtenis aan de rondegrens (§9.2); valt die midden in een lopend venster, dan telt dat gewoon mee bij de eerstvolgende beurteinde-controle — er is geen extra controle direct na de attrition. Een tegenstander op auto-pass (§11.2) krijgt geen laatste kans: zijn automatische beurt telt als verspeeld, en wie tijdens een lopend venster op auto-pass gaat, telt vanaf dat moment als "al geweest". Staan op het moment dat het venster zou openen alle andere nog meespelende spelers op auto-pass, dan is er niemand om een laatste kans te geven en wint de missiehouder meteen. Doorbreekt een tegenstander de voorwaarde tijdens zijn eigen laatste-kans-beurt (de missiehouder voldoet niet langer), dan vervalt de dreigende overwinning en speelt het spel gewoon door — de missiehouder is niet uitgesloten om de missie later opnieuw te vervullen, en ook niemand anders is uitgesloten van winnen. Geen enkele aankondiging op TV of telefoon: niemand weet dat dit venster loopt.
3. **Volle ronde met onthulling.** Mechanisch identiek aan optie 2, met één verschil: zodra het venster opent, toont TV én elke telefoon **wie** mogelijk gaat winnen (uitzondering op de privacyregel in §2) — de missie-inhoud zelf blijft geheim tot de echte afronding (§7).

In alle drie de varianten geldt: ontstaat er tijdens een lopend venster een directe winconditie (werelddominantie, of een `EliminatePlayer`-missie, bij wie dan ook) → die wint meteen, ongeacht het venster. `EliminatePlayer` en werelddominantie zijn zelf nooit aan deze instelling onderhevig: ze zijn onomkeerbaar (wie de laatste tegenstander uitschakelt, heeft daarmee al werelddominantie — er is niemand meer over om iets te heroveren), dus optie 2/3 heeft daar geen functie.

Vereenvoudiging: vervullen meerdere spelers in dezelfde beurt tegelijk een optie-2/3-missie, dan opent alleen de eerste (in de beurtvolgorde) een venster; de overige(n) worden opnieuw beoordeeld zodra dat venster is afgerond.

---

## 7. Uitschakeling & einde spel

- **Uitgeschakelde speler:** telefoon toont een volledig-scherm-melding ("Je bent uitgeschakeld") zolang het spel loopt. Territoriumkaarten van de uitgeschakelde speler gaan naar de veroveraar (klassiek); heeft die daardoor ≥ 6 kaarten, dan direct verplicht inleggen. Dit gebeurt **in de Aanvallen-fase, ná de bevestigde meeverplaatsing** van de eliminerende aanval (§5.3, stap 6) — niet ertussenin. De legers die de inleg oplevert worden direct geplaatst, net als in Versterken; zolang die verplichting open staat kan de speler geen nieuwe aanval aankondigen en de Aanvallen-fase niet afsluiten. De beurttimer loopt gewoon door (hij is op dat moment al hervat). Heeft de speler na de eerste inleg nog steeds ≥ 6 kaarten, dan geldt de verplichting opnieuw — er is geen maximum aan het aantal inlegs. Het **aantal** kaarten in ieders hand is publiek zichtbaar (TV en medespelers, net als bij een fysiek bordspel); de kaarten zelf blijven privé (§2, §6.1).
- **Winnaar bekend:** TV toont de winnaar + missie-onthulling van alle spelers. Alle telefoons (ook van uitgeschakelde spelers) tonen een knop **"Opnieuw spelen"** als stem; bij unanimiteit van de aanwezige spelers start een nieuwe lobby met dezelfde deelnemers.
- **Host-override:** naast de stemknop krijgt alleen de host een tweede, duidelijk onderscheiden actie: **"Nieuw spel instellen"**. Deze slaat de stemming over, gaat direct naar het instellingenscherm (§10, eventueel aangepast) en start meteen een nieuwe lobby met dezelfde deelnemers zodra de host bevestigt. Aanname: dit overschrijft eventuele lopende stemmen van andere spelers zonder waarschuwing — te bevestigen of je liever een korte "host wil herstarten, x seconden om te annuleren" toont.

---

## 8. Rollensysteem (data-driven)

Toewijzing is een lobby-instelling (§10): Random of Kiezen. Rollen zijn openbaar en staan permanent op de TV bij de spelersnaam, ongeacht de toewijzingswijze.

**Random:** Elke speler krijgt bij de spelstart **random** een rol toegewezen. Rollen zijn **openbaar** en staan permanent op de TV bij de spelersnaam.

**Kiezen:** Onderdeel van het Joinen-proces (§2.2), direct na kleurkeuze — dus nog steeds vóór Volgorde Dobbelen en vóór Claimen/Startopstelling. Zelfde mechanisme als kleurkeuze: eerst geselecteerd en gekozen, is geselecteerd en gekozen. Een geselecteerde of gekozen rol is voor spelers die daarna joinen niet meer beschikbaar. Het overzicht toont per rol de naam en omschrijving (incl. effect en herkomstland), zodat de keuze weloverwogen kan zijn. De rolkeuze staat dus nog steeds vast vóórdat er geclaimd wordt, zodat een rol de gebiedskeuze tijdens Claimen kan sturen.

### 8.1 Rollen informatie

- **Herkomstland:** elke rol is gekoppeld aan één gebied. De boost is **alleen actief zolang de speler het herkomstland bezit**. De TV toont per rol of de boost actief is (bijv. gekleurd/uitgegrijsd icoon op het herkomstland).
- **Startrestrictie:** bij de startverdeling krijgt een speler zijn eigen herkomstland nooit toegewezen (bij random verdeling wordt hierop gecorrigeerd; bij claim-modus mag de speler het niet claimen tijdens de setup — daarna uiteraard wel veroveren).
- **Effecten als vaste set effect-types** in de rules engine; rollen zelf zijn JSON:

```json
{
  "id": "president",
  "name": "President",
  "originTerritory": "eastern-united-states",
  "effect": { "type": "ExtraReinforcement", "params": { "amount": 1 } },
  "description": "+1 leger per beurt zolang je het herkomstland bezit."
}
```

Effect-types in v1:

| Type | Parameters | Werking |
|---|---|---|
| `ExtraReinforcement` | `amount` | Extra legers in de versterkingsfase |
| `CardTradeBonus` | `amount` | Extra legers bij kaarteninleg |
| `Reroll` | — | De aanvaller mag, na zijn eigen worp maar **vóórdat de verdediger gooit**, **één keer per doelgebied per beurt** 1 van zijn eigen dobbelstenen zelf kiezen om te herwerpen (zichtbaar op TV als "herworpen": de gekozen dobbelsteen wordt gehighlight en krijgt zijn nieuwe waarde) — niet gebaseerd op "verloren", want er is op dat moment nog niets met de verdediger vergeleken. Een herworpen dobbelsteen kan niet nogmaals herworpen worden. De herwerp geldt per doelgebied: meerdere worpen tegen hetzelfde gebied delen één herwerp, tussendoor een ander gebied aanvallen en terugkomen geeft géén nieuwe; een ander doelgebied heeft zijn eigen herwerp; een nieuwe beurt begint met een schone lei. "Doorgaan" zonder herwerp verbruikt hem niet: bij een volgende worp tegen hetzelfde gebied verschijnt de keuze opnieuw, totdat de aanvaller daadwerkelijk herwerpt. De herwerp-stap heeft **geen timer** (net als de verdediger-keuze; de beurttimer staat tijdens het gevecht toch al stil) |
| `FortifyUpgrade` | `moves` of `throughEnemy` | `moves`: dat aantal verplaatsingen in de Verplaatsen-fase in plaats van één (§5.2); `throughEnemy`: pad door 1 vijandelijk gebied |
| `DefenseBoost` | — | Alleen relevant bij lobby-instelling Dobbelregel = Huisregel (§5.3, §10): de verdediger mag, ook al gooide de aanvaller met 1 dobbelsteen, eenmalig per ronde toch met 2 dobbelstenen verdedigen. Wordt weer beschikbaar aan het begin van de eigen volgende beurt van de rolhouder. Bij Dobbelregel = Klassiek heeft de rol geen functie en zit ze niet in de toewijzingspool |

Bewuste keuze: **geen verborgen kansmanipulatie** (gewogen dobbelstenen). Alle voordelen zijn zichtbaar en telbaar op het bord, zodat uitkomsten aan tafel niet als oneerlijk voelen.

Validatie bij spelstart: aantal rollen ≥ aantal spelers, herkomstlanden bestaan op de geladen kaart, geen dubbele herkomstlanden.

---

## 9. Extra spelelementen (per spel aan/uit door de host)

Alle onderstaande elementen zijn **feature-toggles in de lobby-instellingen** (§10). Standaard staan ze uit, zodat "kaal klassiek" het vertrekpunt is.

### 9.1 Rollen
Zie §8. Toggle: aan/uit.

### 9.2 Gebeurtenisronde (data-driven)
Na elke volledige ronde (alle spelers één beurt gehad) trekt de server een gebeurteniskaart die theatraal op de TV verschijnt. Gebeurtenissen zijn JSON met een effect-type + parameters, zodat je zelf events kunt toevoegen:

```json
{
  "id": "goede-oogst",
  "name": "Goede oogst",
  "description": "Iedereen die een volledig continent bezit krijgt +2 legers.",
  "effect": { "type": "ContinentOwnerBonus", "params": { "amount": 2 } },
  "duration": "instant"
}
```

Effect-types in v1 (uitbreidbaar): `ContinentOwnerBonus`, `SeaRoutesBlocked` (duur: 1 ronde), `RevoltOnSingleArmy` (gebieden met 1 leger worden neutraal tenzij versterkt), `FreeReinforcement` (iedereen +N). Events hebben een `duration`: `instant` of `oneRound`. De TV toont actieve ronde-effecten permanent zolang ze gelden.

**Verloop van de gebeurtenisronde** (besluiten 2026-09-26):
- **Rondegrens:** een ronde is om zodra de beurt van de laatste nog meespelende speler in de beurtvolgorde eindigt; de kaart wordt getrokken vóór de beurt van de volgende speler begint. De **eerste** kaart valt na de eerste volle ronde van het spel zelf — claimen en de startopstelling tellen niet mee.
- **Volgorde bij beurteinde:** eerst de gewone beurteinde-afhandeling (missiecontrole, laatste-kans-venster, §6.1/§6.2). Is het spel daarmee gewonnen, dan wordt er geen kaart meer getrokken. Anders verlopen eerst de lopende `oneRound`-effecten, en pas dan wordt de nieuwe kaart getrokken.
- **Stapel:** de kaarten worden geschud en zonder teruglegging getrokken; is de stapel op, dan worden alle kaarten opnieuw geschud.
- **Duur `oneRound`:** geldt vanaf de trekking tot de volgende rondegrens. Iedere speler speelt er dus precies één beurt mee.
- **Extra legers (`ContinentOwnerBonus`, `FreeReinforcement`):** het bedrag per speler wordt vastgesteld op het moment van trekken (bij `ContinentOwnerBonus`: wie dán een volledig continent bezit). Die legers komen bij de versterkingen van de eerstvolgende eigen beurt van die speler (zichtbaar als "Gebeurteniseffect" in de opbouw) — er is geen losse plaatsingsstap. Het zijn gewone versterkingen: niet geplaatste bonuslegers vervallen bij een verlopen timer, net als de rest van de pool (§5.4).
- **Uitgeschakelde spelers** doen niet mee aan een gebeurtenis.
- **Zichtbaarheid** (besluiten 2026-09-29): de TV toont de getrokken kaart theatraal (8 seconden, bij legerverlies tot iedereen gekozen heeft); elke telefoon krijgt een korte melding met de kaartnaam; de laatst getrokken kaart staat in Spelinfo → Stand (§2.2). Het spelverloop toont ook de uitkomst: de getrokken kaart, de bonus per speler (en bij diens beurtstart welk deel van de versterkingen uit de kaart komt), wie hoeveel legers afstond — ook wie geen legers kón afstaan omdat al zijn gebieden op 1 leger staan — en het moment waarop een ronde-effect voorbij is.

**`SeaRoutesBlocked` — gedrag en varianten:** met álle zeeroutes geblokkeerd valt de kaart uiteen in meerdere componenten en raken 6 eilandgebieden (Groenland, IJsland, Groot-Brittannië, Japan, Madagaskar, Nieuw-Guinea) volledig geïsoleerd. Twee vereisten volgen daaruit:
1. **Geen automatisch overslaan van fases:** heeft een speler die ronde nul geldige aanvallen of verplaatsingen (omdat al zijn gebieden geïsoleerd of afgesloten zijn), dan slaat de server de fase **niet** zelf over. Aanvallen en Verplaatsen eindigen dan zoals altijd: de speler beëindigt de fase of beurt zelf, of de beurttimer verloopt (§5.4). De telefoon biedt dan simpelweg geen geldige doelen aan — dit is bedoeld gedrag, geen bug.
2. **Gedeeltelijke blokkade als variant:** het effect ondersteunt een optionele parameter `routes` (lijst van specifieke `from`/`to`-paren); alleen die zeeroutes worden dan geblokkeerd in plaats van allemaal. Zonder `routes`-parameter geldt de volledige blokkade.

**Nieuwe effect-types (t.o.v. de oorspronkelijke v1-lijst):** `RevoltOnSingleArmy`
is geschrapt (niet gewenst). Daarvoor in de plaats:

| Type | Parameters | Werking |
|---|---|---|
| `TerritoryLocked` | `territoryIds[]` | De genoemde gebieden zijn deze ronde volledig afgesloten: niet aan te vallen, niet vanuit aan te vallen, geen Verplaatsen erin of eruit. Eigenaarschap en legeraantal blijven ongewijzigd. Er komen ook geen legers bij (besluit 2026-10-01): niet bij Versterken, niet uit de inlegpool na een eliminatie (§7) en niet bij een automatische beurt (§11.2). De +2-bezitsbonus van een ingelegde kaart van een afgesloten gebied gaat in de vrije pool. Zijn **al** de gebieden van een speler afgesloten, dan kan hij zijn versterkingen nergens kwijt: hij rondt Versterken af en de legers vervallen; inleggen staat dan stil (een verplichte inleg bij 5+ kaarten wordt overgeslagen, vrijwillig inleggen kan niet), want de opbrengst zou meteen vervallen. Altijd `oneRound`. |
| `ArmyAttrition` | `amount` | Elke speler met meer dan 1 leger op minstens 1 gebied verwijdert in totaal `amount` eigen legers, en **kiest zelf** van welke gebieden — nooit onder de 1 leger per gebied. Heeft een speler minder wegneembare legers dan `amount` (som van (legers − 1) over al zijn gebieden < amount), dan wordt automatisch het maximum weggehaald: elk gebied van die speler komt op 1 leger, de rest van `amount` vervalt. Altijd `instant`. |

**Nieuw interactiepatroon: gelijktijdige keuze door meerdere spelers.**
`ArmyAttrition` is het eerste effect waarbij niet één speler op zijn beurt, maar
**alle getroffen spelers tegelijk**, buiten de normale beurtvolgorde om, een keuze
moeten maken voordat het spel verdergaat:

- Elke speler met daadwerkelijke keuzevrijheid (dus niet degenen die toch al op
  het automatische maximum uitkomen) krijgt op zijn telefoon een
  **"Legers verwijderen"**-scherm: eigen gebieden met legeraantal, tik om een
  leger van een gebied te verwijderen, nooit onder de 1.
- Een speler met **precies** zoveel wegneembare legers als `amount` krijgt het
  scherm ook, al is er maar één uitkomst; alleen bij **minder** gaat het automatisch.
- **Geen timer** — zelfde precedent als de verdediger-keuze en de Reroll-prompt
  (§5.3/§8): de beurttimer speelt hier sowieso geen rol, dit gebeurt tussen
  beurten in. De beurt van de volgende speler (en de berekening van zijn
  versterkingen) begint pas als iedereen met keuzevrijheid gekozen heeft.
- De TV toont een wachtstaat ("nog 2 van de 4 spelers kiezen") totdat iedereen
  met keuzevrijheid heeft gekozen.
- Een speler op auto-pass (§11.2) krijgt geen keuzescherm: de server kiest
  direct voor hem — ook als hij pas op auto-pass gaat terwijl er op hem
  gewacht wordt. De server haalt telkens 1 leger van het gebied met de meeste
  legers (bij gelijkstand: het eerste in de volgorde van de kaartdata), nooit onder de 1,
  tot `amount` bereikt is. Heeft hij minder wegneembare legers dan `amount`,
  dan geldt het gewone automatische maximum.
---

## 10. Lobby-instellingen (host)

| Instelling | Opties | Standaard |
|---|---|---|
| Winconditie | Werelddominantie / Geheime missies | Missies |
| Startopstelling | Random / Claimen | Random |
| Startlegers | Preset: Klassiek / Modern / Klassiek-49 | Klassiek (40/35/30/25/20/18) |
| Dobbelregel | Huisregel / Klassiek | Huisregel |
| Beurttimer (Versterken + Aanvallen) | Aanpasbaar | 3 min |
| Verplaatsen-timer | Aanpasbaar | 1 min |
| Rollen | Aan / uit | Uit |
| Roltoewijzing (alleen als Rollen = Aan) | Random / Kiezen | Random | 
| Gebeurtenisronde | Aan / uit (de kaarten zijn die van de gekozen kaartvariant; heeft die variant geen gebeurteniskaarten, dan weigert de server de start zolang de gebeurtenisronde aan staat) | Uit |
| Kaartenset-waardering | Klassiek escalerend | Klassiek |
| Kaartweergavethema | Klassiek / Modern (`cards.json themes`) | Klassiek — **nog niet geïmplementeerd**, staat vandaag vast op Klassiek |

**Dobbelregel.** Bepaalt wat de verdediger in §5.3 stap 4 mag kiezen. **Huisregel** (bewuste
huisregel, wijkt af van de officiële Risk-regels en van wat hierboven in §5.3 ooit als vaste
regel stond): gooit de aanvaller met 1 dobbelsteen, dan moet de verdediger ook met 1
verdedigen, tenzij hij een actieve `DefenseBoost`-rol inzet (§8.1). **Klassiek:** de verdediger
mag altijd met 2 gooien vanaf 2 legers, ongeacht het aantal aanvalsdobbelstenen — de officiële
regel. Bij Klassiek vallen de drie `DefenseBoost`-rollen uit de roltoewijzingspool (niet
uitgedeeld, niet kiesbaar); alleen relevant als Rollen = Aan.

---

## 11. Randgevallen & beheer

### 11.1 Verbroken verbinding
Automatische reconnect (token). Het spel pauzeert **niet** automatisch; de beurttimer van een afwezige actieve speler loopt gewoon door (en dwingt de beurt af per §5.4). Uitzondering: een verdediger zonder verbinding blokkeert een gevecht (geen verdediger-timer), en een speler zonder verbinding blokkeert een legerverlies-keuze (§9.2) — de host kan die speler dan op auto-pass zetten (§11.2), waarna de server voor hem kiest.

**Host valt weg.** De server houdt bij welke spelers verbonden zijn. Is de host tijdens het spel (na de startopstelling) **2 minuten** onafgebroken zonder verbinding, dan zet de server hem op auto-pass en gaat het host-schap over naar de eerste speler ná hem in de beurtvolgorde (na de laatste weer vooraan beginnend) die niet uitgeschakeld is en niet op auto-pass staat. Dat geldt ook voor een host die al uitgeschakeld is: die gaat niet op auto-pass (hij speelt niet meer mee), maar het host-schap gaat na 2 minuten weg wél over — zolang hij verbonden blijft, blijft hij host. Komt de oude host terug, dan vervalt zijn auto-pass (§11.2), maar hij wordt **niet** opnieuw host. Een korte onderbreking (scherm vergrendelen, even een andere app) telt niet: verbindt hij binnen de 2 minuten opnieuw, dan gebeurt er niets. Staat iedereen behalve de host al op auto-pass, dan gebeurt er ook niets — het spel wacht dan op de host. Na een herstart van de server weet die niet meer wie verbonden was; de 2 minuten gaan pas lopen nadat de host opnieuw verbonden is geweest en de verbinding weer verliest.

### 11.2 Blijvend afwezige speler
De host kan een **andere** speler op **auto-pass** zetten, alleen tijdens het spel (niet in de lobby, de beurtvolgorde-worp, het claimen of de startopstelling). Dat kan niet voor een uitgeschakelde speler, en niet als daarna niemand meer zonder auto-pass zou overblijven. Auto-pass is voor iedereen zichtbaar (TV en telefoons).

Een speler op auto-pass:

- **Houdt zijn gebieden en legers**, en kan nog steeds aangevallen worden.
- **Krijgt een automatische beurt:** de server berekent zijn versterkingen zoals altijd (§5.2, inclusief bonussen uit een gebeurteniskaart, §9.2), legt verplicht in als hij 5 of meer kaarten heeft (de set met de meeste kaarten van eigen gebieden, jokers als laatste; herhaald zolang de verplichting geldt) en verdeelt alle legers om de beurt, één voor één, over zijn **frontgebieden** — eigen gebieden die grenzen aan een gebied van een ander, ook over zee (een tijdelijke zeeblokkade uit §9.2 telt daarbij niet mee) — in de volgorde van de kaartdata. Voor die plaatsing gelden dezelfde regels als voor een speler zelf; een afgesloten gebied (§9.2) krijgt dus niets. Zijn al zijn frontgebieden afgesloten, dan gaan de legers naar zijn overige open gebieden; is er geen enkel open gebied, dan vervallen ze. De bezitsbonus van een ingelegde kaart komt zoals altijd op dat gebied zelf, of in de pool als dat gebied afgesloten is (§9.2). Hij valt niet aan, verplaatst niet, trekt geen kaart en de beurt heeft geen timer. De beurt telt mee voor de rondegrens van de gebeurtenisronde (§9.2) en voor de missiecontrole van de anderen (§6.1), maar niet als laatste kans (§6.2).
- **Verdedigt automatisch** met het maximum dat de gewone regels toestaan, zonder `DefenseBoost` (§5.3).
- **Kiest automatisch** bij een legerverlies-gebeurtenis (§9.2).

Gaat een speler op auto-pass terwijl er op hem gewacht wordt, dan handelt de server dat meteen af:

- Wacht een gevecht op hem als verdediger, dan verdedigt de server direct.
- Staat hij op de wachtlijst van een legerverlies-keuze, dan kiest de server direct.
- Is hij zelf aan de beurt, dan eindigt zijn beurt. Een lopend gevecht wordt eerst uitgespeeld: een openstaande herwerp-keuze wordt "Doorgaan"; wacht het gevecht op een verdediger, dan wacht het spel op diens keuze (en de beurt eindigt zodra die gekozen heeft — de beurttimer loopt dan niet meer verder); na een verovering verhuist het minimum mee. Komt hij terug terwijl zijn gevecht nog op de verdediger wacht, dan speelt hij zijn beurt gewoon verder. Daarna gebeurt hetzelfde als bij een verlopen timer (§5.4) — niet-geplaatste legers vervallen, met dezelfde uitzondering voor een terug te draaien kaarteninleg — en eindigt de beurt. Heeft hij deze beurt een gebied veroverd, dan trekt hij nog zijn kaart. Het is geen eigen beurteinde in de zin van §6.1: de missies van de anderen worden gecontroleerd, zijn `requiresOwnTurn`-missie niet.

**Terugkomen:** auto-pass vervalt vanzelf zodra de telefoon van de speler opnieuw met het spel verbindt (met zijn eigen sessie, §3). Daarvoor is geen actie van de host nodig. Vanaf dat moment speelt hij weer gewoon mee. Wat de server intussen voor hem deed, wordt niet teruggedraaid. Had zijn telefoon de verbinding nooit verloren (hij liep weg met het scherm aan), dan komt hij terug door de app te herladen; zijn telefoon laat zien dat hij op auto-pass staat.

### 11.3 Validatie & integriteit
De server valideert elke actie (juiste speler, juiste fase, geldige gebieden, voldoende legers), ook al toont de UI alleen geldige opties. Dobbelworpen gebeuren uitsluitend server-side.

---

## 12. Hosting

**Primair scenario — Azure App Service + Neon + Vercel:** de API + SignalR-hub draait always-on op **Azure App Service** (Basic B1, Linux); **Neon** levert de managed Postgres voor Marten (directe/unpooled connectie — één always-on instance heeft geen PgBouncer-laag nodig); de frontend staat als static build op **Vercel**, een apart origin met een eigen CORS-toegestane herkomst. Volledig uitgewerkt in `docs/azure-hosting-deployment.md` (provisioning, configuratie, deploy- en testchecklist).

**Alternatief scenario — los kiosk-apparaat ("Plan A"):** een Raspberry Pi (nieuw indien budget het toelaat, anders tweedehands) draait backend + AP lokaal, volledig onafhankelijk van internet. Blijft de voorkeursoptie zodra er een geschikt apparaat binnen budget beschikbaar komt; zie het gespreksverslag voor de docker-compose/hostapd-aanpak.

---

## 13. Content-status rollen, missies en gebeurtenissen

Deze content was oorspronkelijk als "later in te vullen" gemarkeerd; inmiddels staat ze in `data/maps/standaard-43/` en is ze onderdeel van de gevalideerde speeldata:

1. **Rollenset** (`roles.json`) — 18 rollen ingevuld (waarvan 3 `DefenseBoost`-rollen die bij Dobbelregel = Klassiek uit de pool vallen, §10), ruim boven het maximum van 7 spelers, elk met een uniek herkomstland (validatie-eis §8) en een effect-type uit de vaste set (§8.1). Let op één kaart-specifieke restrictie: de rol `maori` heeft `new-zealand` als herkomstland, een gebied dat alleen bestaat op kaartvarianten die Nieuw-Zeeland bevatten (de huidige 43-gebieden-set). Op een kaartvariant zonder Nieuw-Zeeland moet `maori` uitgesloten worden van de toewijzingspool, anders faalt de spelstart-validatie.
2. **Missieset** (`missions.json`) — dekkend voor 7 kleuren: per kleur een `EliminatePlayer`-missie, aangevuld met `ConquerContinents`- en `TerritoryCount(MinArmies)`-missies die tevens als `fallbackMissionId` dienen (§6.1).
3. **Gebeurteniskaarten** (`events.json`) — gebeurtenisronde-content conform §9.2. Ten opzichte van de oorspronkelijke v1-effectlijst is `RevoltOnSingleArmy` geschrapt (niet gewenst); `TerritoryLocked` en `ArmyAttrition` zijn de effect-types die daarvoor in de plaats staan (al opgenomen in §9.2).

Verdere uitbreiding of aanpassing van deze content (extra rollen, andere missies, nieuwe events) blijft mogelijk zonder codewijziging — dat was het hele punt van de data-driven opzet.
