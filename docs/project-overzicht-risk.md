# Project-overzicht — Digitaal Risk

**Doel van dit document:** één plek die samenvat wat er tot nu toe is uitgewerkt, en — belangrijker — wat er nog moet gebeuren vóórdat je met bouwen kunt beginnen.

---

## 1. Wat er klaar is

### 1.1 Functioneel ontwerp
**Bestand:** `functioneel-ontwerp-risk.md`

Het volledige spelconcept staat hierin vast: host-op-TV + spelers-op-telefoon (Jackbox-stijl), gebiedsselectie via hybride highlight+knoppenlijst, aanval/verdediging met zelf te kiezen dobbelstenen, harde beurttimer van 3 minuten die pauzeert tijdens een gevecht, moderne fortify-regel, klassieke kaartenset-waardering, 7 spelers met 18 startlegers, geheime missies + werelddominantie als winconditie, en een kaart-datamodel (§4) met atomaire regio's + groeperingsconfiguratie zodat de kaart uitbreidbaar is. Rollensysteem, missieset en gebeurteniskaarten staan als datamodel + regels vast (§7–9), maar de **inhoud** (welke rollen, welke missies, welke events) is bewust nog leeg — dat vul je later in via JSON, zonder codewijziging.

### 1.2 Design (Claude Design)
**Bestand:** `claude-design-prompts-risk.md`

Drie kant-en-klare prompts (TV-bord, host-opzet/herstart, spelerstelefoon) met alle schermstaten uitgeschreven, klaar om in Claude Design te plakken. Aanbevolen model: **Opus 4.8** (complexe/samenhangende taak, niet Sonnet 5).

### 1.3 Hosting & infrastructuur
**Bestand:** `plan-b-reisopstelling.md`

Gekozen aanpak: backend blijft thuis op Proxmox draaien, bereikbaar via **Tailscale Funnel** (publieke HTTPS-URL, geen installatie nodig bij medespelers); een meegenomen laptop is het TV-scherm. Geen nieuw kiosk-apparaat nodig (Raspberry Pi-aanpak "Plan A" staat als alternatief genoteerd, mocht er ooit een geschikt tweedehands apparaat binnen budget komen). Beveiligingschecklist (rate limiting, Funnel alleen tijdens speelmomenten) en betrouwbaarheids-mitigaties (auto-restart, UPS-advies, noodtoegang via Tailscale) staan uitgewerkt.

### 1.4 Kaart-geodata (de 42 gebieden)
**Bestanden:** `territories.json`, `territories.geo.json`, `build_map.py`, `territories_extended.json` + `.geo.json`

De volledige, geografisch correcte kaart is opgebouwd uit publiek-domein Natural Earth-data: elk gebied is een groep van "atomaire regio's" (meestal hele landen; voor Rusland/VS/Canada/Australië — en alvast China/Brazilië/India/Indonesië/Zuid-Afrika — op provincie-/deelstaatniveau). Dit is bewezen uitbreidbaar door Nieuw-Zeeland en een losgekoppeld Chili toe te voegen zonder nieuwe data te hoeven ophalen (`territories_extended.*`, 44 gebieden). Dit is de **brondata die je in de applicatie gebruikt** — onafhankelijk van hoe de kaart er straks uitziet.

### 1.5 Kaart-visualisatie — geprobeerd, deels losse eindjes
Een poging om jouw AI-gegenereerde referentieafbeelding als achtergrond te gebruiken met mijn correcte gebieden als onzichtbare/klikbare overlay (via beeldsegmentatie + warping) is **losgelaten** na herhaalde uitlijningsfouten (Groenland, Groot-Brittannië, Indonesië vielen buiten hun overlay; interne grenzen konden "golven"). Besluit: geen warping meer — de vormen uit §1.4 zijn altijd leidend. Twee vervolgroutes liggen klaar:
- **Route 1** (ik bouw een procedurele textuur in jouw kleurenpalet/sfeer) — nog niet uitgevoerd.
- **Route 2** (jij regenereert de kunst via Gemini image-to-image, met een silhouet van de correcte 42 gebieden als exacte basis) — silhouet is klaar: `territories_silhouette_nolabels.png` (+ prompt, zie §2.1).

---

## 2. Wat je nog moet doen vóór je gaat bouwen

Op volgorde van "blokkerend voor de kern" naar "kan later":

### 2.1 ~~Beslissen: Route 1 of Route 2 voor de kaart-look~~ ✅ Afgerond
Route 2 gekozen en uitgevoerd: `map-background-final.png` (definitieve, opgeschoonde versie zonder interne territoriumlijnen — 5e Gemini-iteratie, IoU 0.64 totaal / 0.75 Middellandse Zee). Gebruik als statische achtergrond-`<image>` in de TV-kaart, met de klikbare gebieden uit `territories.geo.json` als aparte laag erboven — **let op: de overlay moet dezelfde projectie gebruiken als het v4-silhouet** (lengtegraadbereik −180° tot 191° i.p.v. −180°/180°, vanwege de Kamchatka-fix). Bekende kleine afwijkingen (Indonesië, lichte Antarctica-schim) geaccepteerd.

### 2.2 ~~Grenzen/zeeverbindingen (§4.2 FO) opnieuw doorlopen~~ ✅ Afgerond
Gevalideerd tegen `territories.geo.json`: 7 verbindingen verwijderd (niet meer kloppend), 2 gepromoveerd van zee naar land (Turkije–Midden-Oosten, Indonesië–Siam via Maleisië/Borneo), 6 nieuwe landverbindingen toegevoegd. Onderweg ook een echte databug gefixt (overzeese Franse gebiedsdelen die per ongeluk Zuid-Amerika raakten). Resultaat: `adjacency_validated.json`, 82 verbindingen, alle 42 gebieden verbonden. Direct bruikbaar voor de rules engine.

### 2.2b Review-verwerking ✅ Afgerond (21 juli)
Alle bevindingen uit `review-rapport-risk.md` zijn verwerkt: continentbonussen (`continents.json`), kaartendeck met twee thema's (`cards.json`), kleurenset (`colors.json`), Kaukasus/Yukon/Rusland-banden hergegroepeerd, 89 ontbrekende landen toegewezen (Korea's/Taiwan → china, Caribisch gebied → central-america, etc.), adjacency opnieuw gevalideerd (82 verbindingen, volledig consistent met de geometrie), regels D1–D6 in het FO opgenomen, silhouet hergenereerd en verouderde bestanden opgeruimd.

### 2.3 Inhoud voor rollen, missies en gebeurtenissen
Het datamodel staat (§7–9 FO), de inhoud niet. Concreet nog te maken:
- Rollenset (namen, herkomstlanden, effect-type + parameters)
- Missieset die dekkend is voor 7 kleuren (inclusief fallback-missies)
- Startset gebeurteniskaarten
Dit kan **na** de eerste bouwfases — de architectuur is er al op voorbereid (feature-toggles, JSON), dus dit blokkeert niets.

### 2.4 Twee kleine openstaande keuzes uit het hosting-plan
- Tailscale Funnel: permanent aan, of alleen aanzetten vlak vóór een speelsessie? (afweging: gemak vs. blootstellingsvenster, zie Plan B §4)
- Heb je al een UPS op je Proxmox-host? Zo niet: goedkoopste manier om het grootste restrisico van Plan B te verkleinen (Plan B §5).

### 2.5 ~~Claude Design-prompts daadwerkelijk uitvoeren~~ ✅ Afgerond
Alle drie de prompts (TV, host-opzet, telefoon) zijn gedraaid in Claude Design. Het klikbare prototype van beide schermtypes staat er.

---

## 3. Aanbevolen bouwvolgorde (ter herinnering)

1. **Rules engine als pure C#-library, met unit tests** — geen UI, geen SignalR. Hier heb je §2.2 (grenzen) wél voor nodig.
2. **Minimal API + SignalR eromheen** — lobby, commands, events.
3. **Frontend met placeholder-kaart** (rechthoeken) — hele flow end-to-end werkend krijgen. Kaart-look (§2.1) nog niet nodig.
4. **Echte kaart + visuele polish** — hier komt de output van Route 1 of Route 2 in.
5. **Reconnect-afhandeling** — expliciet vanaf het begin meenemen, niet achteraf.

---

## 4. Bestandenoverzicht

| Bestand | Inhoud |
|---|---|
| `functioneel-ontwerp-risk.md` | Volledig functioneel ontwerp, alle spelregels + datamodellen |
| `technisch-ontwerp-risk.md` | Technisch ontwerp: architectuur, stack, event sourcing, teststrategie |
| `claude-design-prompts-risk.md` | 3 design-prompts (TV, host-opzet, telefoon) |
| `plan-b-reisopstelling.md` | Hosting-plan: Tailscale Funnel + laptop-als-TV |
| `territories.json` | Groeperingsconfiguratie: 42 gebieden → atomaire regio's |
| `territories.geo.json` | Diezelfde 42 gebieden met echte polygon-geometrie |
| `territories_extended.json` / `.geo.json` | Bewijs van uitbreidbaarheid: +Chili, +Nieuw-Zeeland (44) |
| `adjacency_validated.json` | Gevalideerde land/zee-grenzen (82), volledig consistent met de geometrie |
| `continents.json` | Continentbonussen (klassiek) + herberekeningsrichtlijn |
| `colors.json` | De 7 spelerskleuren (Claude Design) incl. kleurenblind-symbolen |
| `cards.json` | Territoriumkaarten-deck: 42+2, set-regels, twee thema's |
| `build_map.py` | Script dat de kaart uit Natural Earth-data (her)genereert (incl. alle review-fixes) |
| `review-rapport-risk.md` | Reviewbevindingen + genomen beslissingen (historie) |
| `territories_silhouette_nolabels.png` | Basisafbeelding voor Route 2 (Gemini image-to-image) |
| `route2-gemini-prompt.md` | Uitgebreide Gemini-prompt + gebruiksinstructies voor Route 2 |

---

## 5. Belangrijkste les uit dit traject

De kaart-vorm (§1.4) en de kaart-look (§1.5) zijn bewust twee losse dingen geworden. Dat is geen omweg geweest maar het punt: de data waarop je klik-detectie en spellogica bouwt staat vast en is gegarandeerd correct, onafhankelijk van welke visuele stijl je er uiteindelijk voor kiest — en van eventuele volgende iteraties op die stijl.
