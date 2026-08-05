# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Vrienden- en familiegroepen die fysiek samen in dezelfde ruimte spelen: één gedeeld
TV/host-scherm als bord, elke speler bedient het spel via zijn eigen telefoon
("Jackbox-stijl"). 2 tot 7 spelers per sessie. Eén speler is host: zet het spel op,
start het, kan een afwezige speler op auto-pass zetten.

## Product Purpose

Een digitale implementatie van Risk ("Operatie Atlas"): de TV toont passief het
speelbord (kaart, beurt, fase, acties, dobbelworpen, veroveringen), telefoons tonen
contextuele actieknoppen en privé-informatie (eigen kaarten, geheime missie). De
server is authoritative — alle regels, worpen en validaties gebeuren server-side.
Succes = een vlekkeloze vervanging van het fysieke bordspel, met dezelfde sociale
dynamiek (iedereen kijkt naar hetzelfde scherm, beslist via eigen telefoon).

## Positioning

Combinatie van twee bestaande patronen die los wel bestaan maar niet samen in een
Risk-implementatie: (1) Jackbox-achtige TV-plus-telefoon regie, en (2) een volledig
data-driven speldefinitie (kaart, continenten, missies, rollen en gebeurtenissen
in JSON) zodat content zonder codewijziging aangepast kan worden.

## Operating Context

- Self-hosted server, LAN of remote via Tailscale; Azure-hosting is een
  toekomstplan, geen huidige eis.
- Alleen live sessies in v1 — geen opslaan/hervatten.
- Joinen via QR-code op de TV → naam → kleur → (optioneel) rol → lobby.
- TV-hardware is vaak verouderd (typische woonkamer-apparatuur); dit is een
  harde randvoorwaarde voor motion-werk, zie Accessibility & Inclusion.

## Capabilities and Constraints

- Kaart, continenten, adjacency, missies, rollen en gebeurtenissen zijn volledig
  data-driven (`data/*.json`), bevroren zonder expliciete opdracht.
- `RiskGame.Rules` is een pure rules engine zonder ASP.NET/SignalR/I/O-afhankelijkheden;
  dobbelen loopt via een injecteerbare `IRandomSource`.
- `DESIGN.md` (repo-root) is de normatieve visuele specificatie voor TV- en
  telefoonschermen — even bindend als het FO voor spelregels.
- Kaart-projectie: lengtegraadbereik −180° tot 191° (niet standaard −180/180) om
  Kamchatka's oostpunt aan het vasteland te houden.

## Evidence on Hand

- `docs/functioneel-ontwerp-risk.md` — volledig FO met spelregels, schermen, flows.
- `docs/technisch-ontwerp-risk.md` — architectuur en stack.
- `DESIGN.md` — genormeerde visuele referentie voor TV en telefoon.
- `data/*.json` — gevalideerde speeldata (territoria, kleuren, kaartendeck).
- Geen testimonials, klantcases of marketingclaims aanwezig of van toepassing —
  dit is geen publiek-gerichte marketingoppervlakte.

## Product Principles

- Het design is specificatie, geen inspiratie: bij twijfel volgt de implementatie
  `DESIGN.md`, niet een "verbeterde" eigen interpretatie.
- Server is altijd authoritative; client toont nooit ongeldige opties, maar de
  server valideert sowieso opnieuw.
- Data-driven boven hardcoded: spelinhoud (kaart, missies, rollen, events) leeft
  in JSON, niet in code.
- Bouw in vastgestelde volgorde (rules engine → event sourcing → API/hub →
  placeholder-kaart → echte kaartlaag → reconnect/randgevallen); niet vooruitwerken
  op een latere stap.
- Onzichtbaar ontwerp: als een scherm zonder een element even duidelijk
  blijft, verdwijnt dat element. Chrome (rand, glow, extra gewicht,
  beweging) draagt spelstatus — het bestaat nooit om "af" te ogen.

## Accessibility & Inclusion

- Spelerkleuren (tot 7) moeten onderscheidbaar blijven voor kleurenblinde spelers
  (bv. aanvullende patronen/iconen naast kleur, niet uitsluitend kleur als signaal).
- TV-hardware is vaak verouderd: animaties en motion-effecten moeten de GPU zo min
  mogelijk belasten (bv. voorkeur voor transform/opacity-animaties boven zware
  effecten, bewust spaarzaam met simultane animaties op het host-scherm).
