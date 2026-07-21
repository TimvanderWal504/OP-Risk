# Host-scherm (TV) — Operatie Atlas

Werkende implementatie van `Operatie Atlas Host-scherm.dc.html` uit het Claude
Design-project *Operatie Atlas host-scherm* (`eb085b62-6d4e-4e35-a70e-94d0d0d080d6`),
omgezet van het DC/React-prototype naar plain HTML/CSS/JS — geen build, geen
dependencies.

## Draaien

```bash
cd host
python -m http.server 8899
# → http://localhost:8899/index.html
```

Een `file://`-open werkt ook, maar dan blokkeert de browser mogelijk de
kaartachtergrond; gebruik liever de statische server.

## Bediening

| | |
|---|---|
| `←` / `→` / `spatie` | vorige / volgende schermstaat |
| `L` | NL ↔ EN |
| `0`–`8` | direct naar een staat |
| `?state=5` | start op een staat |
| `?lang=en` | start in het Engels |
| `?bar=0` | demobalk verbergen (speelstand) |

## De negen schermstaten

0 Lobby · 1 Volgorde bepalen · 2 Gebieden claimen · 3 Hoofdscherm ·
4 Gebiedsselectie · 5 Gevecht · 6 Gebeurteniskaart · 7 Speler uitgeschakeld ·
8 Winnaar

Staat 2 deelt de laatste 9 gebieden live uit (850 ms per gebied) en rolt daarna
automatisch door naar staat 3 — net als in het ontwerp.

## Bestanden

| Bestand | Inhoud |
|---|---|
| `index.html` | Skelet: 1920×1080-stage die naar het TV-formaat wordt geschaald |
| `css/tokens.css` | Design-tokens, 1-op-1 uit `ds/colors_and_type.css` |
| `css/stage.css` | Stage-layout + alle `atlas*`-keyframes uit het ontwerp |
| `js/data.js` | Demo-fixture: spelers, gebieden, teksten (NL/EN), feed |
| `js/host.js` | Viewmodel (port van `renderVals()`) + renderers per staat |
| `assets/map-background-final.png` | Kaartachtergrond (kopie van `files/`) |

## Aansluiten op de echte backend

Alles wat de templates lezen komt uit één functie: `viewmodel()` in
`js/host.js`. Dat is bewust het enige aanhechtingspunt.

1. Vervang de fixture in `js/data.js` door de SignalR-gamestate.
2. Laat `viewmodel()` die state omzetten in dezelfde velden — de renderers
   hoeven niet mee te veranderen.
3. Roep `render()` aan op elk binnenkomend event in plaats van op toetsaanslag.

Twee dingen zijn nu nog placeholder en horen bij bouwvolgorde-stap 4 uit
`files/project-overzicht-risk.md`:

- **Kaartvorm.** `ATLAS.TERR` bevat de schematische polygonen uit het ontwerp
  (de "rechthoeken-kaart" van stap 3). De geografisch correcte vormen staan in
  `files/territories.geo.json`; de `id`'s komen al overeen, dus dat is een
  datavervanging, geen codewijziging.
- **QR-code.** `buildQR()` tekent een deterministisch *patroon*, geen scanbare
  code. Zodra de join-URL dynamisch is (Tailscale Funnel-hostnaam + spelcode)
  moet hier een echte encoder in.

Verder: `css/tokens.css` haalt de fonts van de Google Fonts-CDN. Voor een
speelsessie zonder betrouwbaar internet die `@import` vervangen door
zelf-gehoste woff2.

## Afwijkingen t.o.v. het ontwerp

- De uitschakel-overlay gebruikte `t.elimKicker`, een sleutel die in geen van
  beide taalsets bestaat (rendert dus leeg). Hier staat nu `t.eliminated`
  ("Uitgeschakeld" / "Eliminated").
- Het thema staat vast op dark via `<html class="dark">`, zodat een laptop in
  lichte modus alsnog het broadcast-donkere scherm aanstuurt.
