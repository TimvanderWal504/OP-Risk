# Functioneel Ontwerp — Digitaal Risk (Host + Telefoons)

**Versie:** 1.2 · **Datum:** 21 juli 2026 · **Status:** Vastgesteld (incl. review-verwerking)

---

## 1. Concept

Een digitale Risk-implementatie in Jackbox-stijl. Eén **host-scherm** (TV/groot scherm) toont passief het speelbord; elke speler bestuurt het spel via zijn **eigen telefoon**. De server (self-hosted, later optioneel Azure) is authoritative: alle spelregels, dobbelworpen en validaties gebeuren server-side.

- **Spelers:** 2 t/m 7
- **Sessies:** alleen live (geen opslaan/hervatten in v1)
- **Netwerk:** LAN + remote via Tailscale; Azure-hosting als toekomstplan (§12)
- **Kaart, missies, rollen en gebeurtenissen:** volledig data-driven (JSON, zie §4 voor de kaart), zodat content zonder codewijziging kan worden toegevoegd of aangepast

---

## 2. Rollen & schermen

### 2.1 Host-scherm (TV) — passief bord

De host-TV heeft **geen** bedieningsfunctie. Het toont:

- De wereldkaart met alle gebieden, kleuren per speler en legeraantallen
- Wiens beurt het is + actieve fase (Versterken / Aanvallen / Verplaatsen) + resterende beurttijd
- Alle uitgevoerde acties als visuele gebeurtenis: kaarteninleg, geplaatste legers, gestarte aanvallen, dobbelworpen (dobbelstenen "rollen het scherm in"), gevechtsuitkomsten, veroveringen, verplaatsingen
- Highlighting van geldige gebieden tijdens gebiedsselectie van de actieve speler (zie §2.3)
- Openbare rolinformatie van alle spelers (§8)
- Gebeurteniskaarten bij een gebeurtenisronde (§9.2)
- QR-code om te joinen (in de lobby)

### 2.2 Spelerstelefoon

De telefoon van de speler toont drie soorten informatie:

1. **Contextuele actieknoppen** — alleen de acties die de speler op dát moment mag doen: "Val aan" (+ onderliggende stappen), "Versterk" (+ onderliggende stappen), "Verplaats", "Beëindig beurt", "Leg kaarten in", "Gooi", dobbelsteenkeuze bij verdediging.
2. **Privé-informatie** — eigen territoriumkaarten en eigen geheime missie. Deze verschijnen nooit op de TV.
3. **Spelinformatie** — ranglijst/overzicht: wie heeft de meeste gebieden, welke continenten zijn in bezit en van wie, legertotalen.

De host is functioneel gewoon een speler met een telefoon, met als enige extra bevoegdheden: spel opzetten (lobby, instellingen §10), spel starten, een afwezige speler op auto-pass zetten (§11.2), en na afloop direct een nieuw spel opzetten (§7).

**Host-opzetflow (vóór de lobby):** de host opent dezelfde app als elke speler, maar kiest bij het openen "Nieuw spel starten" in plaats van "Deelnemen aan spel". Dit leidt naar het instellingenscherm (§10); pas na bevestiging daarvan wordt de lobby aangemaakt en verschijnt de QR-code op de TV. Dit is de enige plek waar de host een ander scherm ziet dan een reguliere speler vóór de lobby.

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

**Validatie tegen `territories.geo.json` (afgerond, incl. review-beslissingen):** de definitieve lijst (84 verbindingen: 60 land + 24 zee, `adjacency_validated.json`) is volledig consistent met de polygon-geometrie: **elke land-verbinding raakt ook daadwerkelijk geometrisch, en er bestaan geen rakende gebiedsparen die buiten de lijst vallen** (geautomatiseerd geverifieerd). De belangrijkste beslissingen die hierin verwerkt zijn:
- **Kaukasus-gat gedicht:** Georgië, Armenië en Azerbeidzjan zijn aan `ukraine` toegewezen, waardoor de klassieke `middle-east–ukraine`-verbinding ook geometrisch klopt.
- **Yukon hergegroepeerd** naar `northwest-territory`, waardoor de klassieke `alaska–northwest-territory`-verbinding hersteld is.
- **Rusland-banden herzien** naar de klassieke lay-out (Siberië als verticale band die Mongolië en China raakt; Irkutsk/Yakutsk oostelijker).
- **Bewust geaccepteerde afwijkingen van klassiek Risk** (precieze geografie wint): `eastern-united-states–central-america`, `north-africa–east-africa`, `ural–china` en `mongolia–kamchatka` bestaan niet meer; nieuw zijn o.a. `quebec–northwest-territory`, `irkutsk–china`, `congo–egypt` en `afghanistan–siberia`.
- **Nieuw-Zeeland toegevoegd als 43e gebied** (continent Australië, atomaire regio `NZL`) met twee zeeverbindingen: `new-zealand–eastern-australia` en `new-zealand–argentina`. Die laatste is een bewuste spelontwerpkeuze zonder klassiek precedent: ze geeft Australië een tweede toegangspunt van buitenaf (naast `siam–indonesia`) en verbindt het continent rechtstreeks met Zuid-Amerika. De continentbonus van Australië is daarop aangepast (§4.4).
- Alle 43 gebieden blijven onderling verbonden (volledige graaf).

### 4.3 Genereren op het beeld (TV)

Met echte polygonen (§4.1) in plaats van simpele punten wordt de TV-weergave nog steeds volledig **gegenereerd**, alleen nu op basis van échte kustlijn-vormen in plaats van abstracte nodes:

- Elk territorium wordt een `<path>` uit `territories.geo.json`, gekleurd naar de huidige eigenaar.
- Elke `border`-entry (§4.2) wordt een verbindingslijn tussen de centroids van de twee betrokken gebieden; het `type`-veld bepaalt de stijl: **land = doorgetrokken lijn, sea = gestippelde lijn**.
- Een nieuw gebied toevoegen (zoals hierboven aangetoond met Nieuw-Zeeland/Chili) vereist geen nieuwe illustratie — alleen een configuratiewijziging plus het herdraaien van het generatiescript.

### 4.4 Overige speldata (continenten, kleuren, kaartendeck)

Drie aanvullende databestanden completeren de spel-dataset:

- **`continents.json`** — de continentbonussen: NA 5, ZA 2, EU 5, AF 3, AZ 7, **AU 3**. De eerste vijf zijn de klassieke waarden; Australië is verhoogd van 2 naar 3 omdat het continent met Nieuw-Zeeland op 5 gebieden en 2 toegangspunten komt (§4.2). Bij verdere uitbreiding van de kaart worden de bonussen per continent herzien op basis van het nieuwe aantal gebieden en toegangspunten (vuistregel: bonus ≈ aantal gebieden / 2, +1 voor moeilijk verdedigbare continenten).
- **`colors.json`** — de 7 spelerskleuren uit het Claude Design-ontwerp: Rood `#C0392B`, Blauw `#215C9C`, Groen `#4F7A2E`, Geel `#E0A81C`, Paars `#8E4585`, Oranje `#D97A1A`, Cyaan `#158F8A`, elk met een kleurenblind-vriendelijk symbool. Missies verwijzen naar deze kleur-ID's.
- **`cards.json`** — de **regels** van het territoriumkaarten-deck, niet het deck zelf. Het deck wordt door de rules engine **afgeleid** uit de gebieden van de actieve kaartvariant: één kaart per gebied, alfabetisch op `territoryId` met de symbolen cyclisch verdeeld, plus het aantal jokers uit `deck.jokerCount`. Voor de standaard-43-kaart geeft dat 43 gebiedskaarten + 2 jokers = 45, met symboolverdeling 15/14/14 (43 is niet deelbaar door 3, dus één symbool krijgt er één extra). Reden voor afleiden in plaats van opsommen: een kaartvariant kan zo geen deck hebben dat niet bij zijn eigen gebieden past, en een gebied toevoegen vereist geen tweede handmatige wijziging. Het bestand bevat wél `deck.symbols` en `deck.jokerCount` (zodat aantallen niet in code staan) en de set-regels. Symbolen zijn thema-neutrale ID's met twee weergavethema's: **klassiek** (Infanterie / Cavalerie / Artillerie) en **modern** (Infanterie / Pantser / Drone). Geldige sets: 3× hetzelfde symbool of 1 van elk; een joker vervangt elk symbool. Het deck bevat ook de regel **`ownedTerritoryBonus: 2`**: leg je een kaart in van een gebied dat je op dat moment bezit, dan plaats je direct 2 extra legers op dat gebied (klassieke regel; per spel aanpasbaar in de data).

---

## 5. Spelverloop

### 5.1 Startopstelling

Twee modi, instelbaar in de lobby (§10). **Standaard: random verdeeld.**

- **Random (standaard):** de server verdeelt alle gebieden gelijkmatig willekeurig; daarna plaatsen spelers om beurten hun resterende startlegers (1 per keer, klassiek).
- **Claimen:** spelers claimen om beurten één leeg gebied tot alles verdeeld is; daarna om beurten resterende legers bijplaatsen.

**Startlegers:** 18 per speler bij 7 spelers. Voor 2–6 spelers gelden de klassieke aantallen (40/35/30/25/20). Instelbaar als lobby-parameter.

**Rolrestrictie bij verdeling:** een speler mag zijn eigen rol-herkomstland niet in startbezit krijgen (§8).

### 5.2 Beurtstructuur

Klassiek: **Versterken → Aanvallen → Verplaatsen (Fortify)**.

- **Versterken:** legers = max(3, ⌊eigen gebieden / 3⌋) + continentbonussen + rolbonussen + eventuele kaarteninleg.
- **Kaarteninleg:** klassiek escalerend (4, 6, 8, 10, 12, 15, daarna telkens +5). Inleg bij 5+ kaarten verplicht aan het begin van de versterkingsfase. Deck, geldige sets, jokers en de +2-bezitsbonus staan in `cards.json` (§4.4). Na elke beurt waarin de speler minstens één gebied veroverde, trekt hij 1 kaart.
- **Aanvallen:** onbeperkt aantal aanvallen. Aanvaller kiest per worp 1–3 dobbelstenen, verdediger kiest 1–2 (§5.3). Na verovering verplicht minimaal zoveel legers meeverplaatsen als gebruikte aanvalsdobbelstenen.
- **Verplaatsen:** de **moderne variant** — één verplaatsing over een aaneengesloten pad van eigen gebieden (niet beperkt tot directe buren). **Kernregel:** in het brongebied moet minimaal 1 leger achterblijven.

### 5.3 Gevechten & dobbelen

1. Aanvaller kiest herkomst- en doelgebied (hybride selectie §2.3) en het aantal dobbelstenen. **Kernregel:** aanvallen kan alleen vanuit een gebied met minimaal 2 legers, en het aantal aanvalsdobbelstenen is maximaal (legers in het brongebied − 1), met een absoluut maximum van 3.
2. Aanvaller drukt **"Gooi"** — dit is tegelijk de bevestiging van de aanval (§5.5). De server gooit meteen de aanvalsdobbelstenen, zichtbaar op TV.
3. Heeft de aanvaller een actieve `Reroll`-rol (§8), dan mag hij — nog vóórdat de verdediger heeft gegooid — zelf kiezen of hij 1 van zijn eigen dobbelstenen herwerpt (tot het aantal dat de rol per beurt toestaat). Dit is dus altijd vóór enige vergelijking met de verdediger.
4. De verdediger krijgt op zijn telefoon de keuze: verdedigen met 1 of 2 dobbelstenen. **Harde regel:** een verdediger met slechts 1 leger in het gebied kan alleen 1 dobbelsteen kiezen (de UI toont dan geen keuze). **De verdediger heeft geen timer.**
5. De server gooit de verdedigingsdobbelstenen, zichtbaar op TV. Uitkomst (verliezen per kant) wordt bepaald door de (eventueel herworpen) aanvalsworp tegen de verdedigingsworp te vergelijken, en op de TV getoond en verwerkt.
6. Bij verovering: aanvaller kiest hoeveel legers hij meeverplaatst (minimaal het aantal gebruikte aanvalsdobbelstenen).

### 5.4 Beurttimer

- **Harde timer van standaard 3 minuten** voor de fases Versterken + Aanvallen, zichtbaar op de TV. Eén doorlopende timer over beide fases, niet per fase.
- De timer **pauzeert** zodra de aanvaller "Gooi" drukt en loopt pas weer zodra de volledige gevechtsuitkomst (incl. keuze van de verdediger en eventuele meeverplaatsing na verovering) is afgehandeld. Uitgevoerde acties kosten de aanvaller dus geen beurttijd.
- **Bij aflopen van de timer** springt de beurt naar de Verplaatsen-fase.
- **Bij het ingaan van de Verplaatsen-fase** (via timeout óf regulier) wordt de timer altijd op de Verplaatsen-timer gezet, standaard **1 minuut**. Loopt die af, dan eindigt de beurt (zonder verplaatsing indien niet bevestigd).
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
| `EliminatePlayer` | `targetColor`, `fallbackMissionId` | Schakel Geel uit |
| `WorldDomination` | — | Verover alles |

```json
{
  "id": "eliminate-yellow",
  "type": "EliminatePlayer",
  "params": { "targetColor": "yellow" },
  "fallbackMissionId": "conquer-24",
  "name": "Schakel de gele speler uit",
  "description": "Vernietig alle legers van de gele speler."
}
```

**Wanneer worden missies gecontroleerd?** De server controleert de missievoorwaarden **na elke beurt** — dus ook wanneer jouw missie vervuld raakt door de actie van een ander (bijv. jouw doelwit wordt door een derde uitgeschakeld op het moment dat jij al aan de fallback-voorwaarde voldoet). Uitzondering: missies met het veld `requiresOwnTurn: true` worden alléén gehonoreerd aan het einde van de eigen beurt van de missiehouder; dit veld wordt altijd gerespecteerd.

Regels rond `EliminatePlayer`:
- Is het doelwit de speler zelf (eigen kleur) of doet die kleur niet mee → direct de fallback-missie.
- Wordt het doelwit door een **andere** speler uitgeschakeld → speler krijgt automatisch de fallback-missie (melding op eigen telefoon, niet op TV).
- Bij 7 spelers moet de missieset dekkend zijn voor 7 kleuren; de set wordt bij de start gevalideerd (server weigert een start met inconsistente missiedata).

---

## 7. Uitschakeling & einde spel

- **Uitgeschakelde speler:** telefoon toont een volledig-scherm-melding ("Je bent uitgeschakeld") zolang het spel loopt. Territoriumkaarten van de uitgeschakelde speler gaan naar de veroveraar (klassiek); heeft die daardoor ≥ 6 kaarten, dan direct verplicht inleggen.
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
| `Reroll` | `perTurn` | De aanvaller mag, na zijn eigen worp maar **vóórdat de verdediger gooit**, per beurt 1 van zijn eigen dobbelstenen zelf kiezen om te herwerpen (zichtbaar op TV als "herworpen") — niet gebaseerd op "verloren", want er is op dat moment nog niets met de verdediger vergeleken. De herwerp-prompt heeft **geen timer** (net als de verdediger-keuze; de beurttimer staat tijdens het gevecht toch al stil) |
| `FortifyUpgrade` | `moves` of `throughEnemy` | Extra verplaatsing, of pad door 1 vijandelijk gebied |

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

**`SeaRoutesBlocked` — gedrag en varianten:** met álle zeeroutes geblokkeerd valt de kaart uiteen in meerdere componenten en raken 6 eilandgebieden (Groenland, IJsland, Groot-Brittannië, Japan, Madagaskar, Nieuw-Guinea) volledig geïsoleerd. Twee vereisten volgen daaruit:
1. **De rules engine handelt lege fases netjes af:** heeft een speler die ronde nul geldige aanvallen of verplaatsingen (omdat al zijn gebieden geïsoleerd zijn), dan wordt de betreffende fase automatisch overgeslagen met een duidelijke melding op TV en telefoon — dit is bedoeld gedrag, geen bug.
2. **Gedeeltelijke blokkade als variant:** het effect ondersteunt een optionele parameter `routes` (lijst van specifieke `from`/`to`-paren); alleen die zeeroutes worden dan geblokkeerd in plaats van allemaal. Zonder `routes`-parameter geldt de volledige blokkade.

**Nieuwe effect-types (t.o.v. de oorspronkelijke v1-lijst):** `RevoltOnSingleArmy`
is geschrapt (niet gewenst). Daarvoor in de plaats:

| Type | Parameters | Werking |
|---|---|---|
| `TerritoryLocked` | `territoryIds[]` | De genoemde gebieden zijn deze ronde volledig afgesloten: niet aan te vallen, niet vanuit aan te vallen, geen Verplaatsen erin of eruit. Eigenaarschap en legeraantal blijven ongewijzigd. Altijd `oneRound`. |
| `ArmyAttrition` | `amount` | Elke speler met meer dan 1 leger op minstens 1 gebied verwijdert in totaal `amount` eigen legers, en **kiest zelf** van welke gebieden — nooit onder de 1 leger per gebied. Heeft een speler minder wegneembare legers dan `amount` (som van (legers − 1) over al zijn gebieden < amount), dan wordt automatisch het maximum weggehaald: elk gebied van die speler komt op 1 leger, de rest van `amount` vervalt. Altijd `instant`. |

**Nieuw interactiepatroon: gelijktijdige keuze door meerdere spelers.**
`ArmyAttrition` is het eerste effect waarbij niet één speler op zijn beurt, maar
**alle getroffen spelers tegelijk**, buiten de normale beurtvolgorde om, een keuze
moeten maken voordat het spel verdergaat:

- Elke speler met daadwerkelijke keuzevrijheid (dus niet degenen die toch al op
  het automatische maximum uitkomen) krijgt op zijn telefoon een
  **"Legers verwijderen"**-scherm: eigen gebieden met legeraantal, tik om een
  leger van een gebied te verwijderen, nooit onder de 1.
- **Geen timer** — zelfde precedent als de verdediger-keuze en de Reroll-prompt
  (§5.3/§8): de beurttimer speelt hier sowieso geen rol, dit gebeurt tussen
  beurten in.
- De TV toont een wachtstaat ("nog 2 van de 4 spelers kiezen") totdat iedereen
  met keuzevrijheid heeft gekozen.
- Een speler die niet reageert en op auto-pass staat (§11.2): de server kiest
  voor hem automatisch de grootste stapels leeg, zelfde logica als de
  verdediger-op-auto-pass ("verdedigt automatisch met maximum").
---

## 10. Lobby-instellingen (host)

| Instelling | Opties | Standaard |
|---|---|---|
| Winconditie | Werelddominantie / Geheime missies | Missies |
| Startopstelling | Random / Claimen | Random |
| Startlegers | Per spelersaantal, aanpasbaar | Klassiek; 18 bij 7 spelers |
| Beurttimer (Versterken + Aanvallen) | Aanpasbaar | 3 min |
| Verplaatsen-timer | Aanpasbaar | 1 min |
| Rollen | Aan / uit | Uit |
| Roltoewijzing (alleen als Rollen = Aan) | Random / Kiezen | Random | 
| Gebeurtenisronde | Aan / uit + eventset | Uit |
| Kaartenset-waardering | Klassiek escalerend | Klassiek |

---

## 11. Randgevallen & beheer

### 11.1 Verbroken verbinding
Automatische reconnect (token). Het spel pauzeert **niet** automatisch; de beurttimer van een afwezige actieve speler loopt gewoon door (en dwingt de beurt af per §5.4). Uitzondering: een verdediger zonder verbinding blokkeert een gevecht (geen verdediger-timer) — de host kan die speler dan op auto-pass zetten, waarna de server voor hem met het maximum verdedigt.

### 11.2 Blijvend afwezige speler
De host kan een speler op **auto-pass** zetten: gebieden en legers blijven staan, beurten worden overgeslagen, verdediging gebeurt automatisch met maximum. Auto-pass is door de host weer op te heffen als de speler terugkeert.

### 11.3 Validatie & integriteit
De server valideert elke actie (juiste speler, juiste fase, geldige gebieden, voldoende legers), ook al toont de UI alleen geldige opties. Dobbelworpen gebeuren uitsluitend server-side.

---

## 12. Hosting

**Primair scenario — reisopstelling zonder los kiosk-apparaat ("Plan B"):** backend blijft altijd thuis draaien op Proxmox; onderweg wordt de server bereikbaar gemaakt via **Tailscale Funnel** (publieke HTTPS-URL, geen installatie nodig bij medespelers) en een meegenomen laptop fungeert als TV-scherm. Volledig uitgewerkt in `plan-b-reisopstelling.md` (architectuur, beveiliging, betrouwbaarheid, deploy- en testchecklist).

**Alternatief scenario — los kiosk-apparaat ("Plan A"):** een Raspberry Pi (nieuw indien budget het toelaat, anders tweedehands) draait backend + AP lokaal, volledig onafhankelijk van internet. Blijft de voorkeursoptie zodra er een geschikt apparaat binnen budget beschikbaar komt; zie het gespreksverslag voor de docker-compose/hostapd-aanpak.

**Later — Azure (plan op hoofdlijnen, voor een eventuele publieke/always-on variant):**
- **Azure Container Apps** voor de server (WebSockets/SignalR ondersteund, schaal naar 0 buiten speelsessies om kosten te drukken)
- Bij meerdere instanties: **Azure SignalR Service** als backplane (voor één huiskamer-instantie onnodig)
- **Azure Database for PostgreSQL – Flexible Server** (Marten blijft ongewijzigd; kleinste tier volstaat)
- Frontend als static assets via **Azure Static Web Apps** of vanuit de container zelf
- Toegang: publiek met game-codes, of privé houden via Tailscale op een VM — te beslissen bij uitwerking

---

## 13. Latere toevoegingen (buiten v1-scope, architectuur houdt er rekening mee)

1. Definitieve rollenset (welke rollen, herkomstlanden, effect-parameters) — JSON, iteratief in te vullen.
2. Definitieve missieset voor 7 kleuren — JSON.
3. Startset gebeurteniskaarten — JSON.
