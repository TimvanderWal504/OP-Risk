# RiskOP — projectinstructies

## Wat is dit

Digitale Risk-variant ("Operatie Atlas"): een .NET backend met pure rules engine +
Minimal API/SignalR, en een React-frontend met een TV/host-scherm en een
telefoon-scherm per speler.

## Bronnen van waarheid, in deze volgorde

1. `docs/functioneel-ontwerp-risk.md` — spelregels; nooit zelf invullen bij twijfel, vraag het na
2. `docs/technisch-ontwerp-risk.md` — architectuur en stack
3. `data/*.json` — alle kaart-, kleur-, kaartendeck- en grenzendata

## Repo-indeling

| Pad | Inhoud |
| --- | --- |
| [docs/](docs/) | Functioneel ontwerp (FO), technisch ontwerp (TO), projectoverzicht |
| [data/](data/) | Speeldata: territoria, adjacency, continenten, kleuren, kaarten, kaartachtergrond |
| [src/RiskGame.Rules/](src/RiskGame.Rules/) | **Stap 1** — pure C# rules engine, geen I/O, geen framework-afhankelijkheden |
| [src/RiskGame.Rules.Tests/](src/RiskGame.Rules.Tests/) | Unit tests op de rules engine |
| [src/RiskGame.Api/](src/RiskGame.Api/) | **Stap 2–3** — Minimal API + SignalR hub |
| [src/RiskGame.Api.Tests/](src/RiskGame.Api.Tests/) | Integratietests op de API |
| [frontend/src/design-reference/](frontend/src/design-reference/) | Ruwe Design-MCP-export — **ONGEWIJZIGD laten**, alleen lezen |
| [frontend/src/components/](frontend/src/components/) | "Echte" componenten, geïnspireerd op `design-reference/` |
| [frontend/src/map/](frontend/src/map/) | Projectie-logica + SVG-overlay (§7.2 TO) |
| [frontend/src/hooks/](frontend/src/hooks/) | `useSignalR`, `useGameState` |
| [frontend/src/types/](frontend/src/types/) | Gedeelde TypeScript-types |

## Werkafspraken

- `design-reference/` is read-only referentiemateriaal. Nooit bewerken; wel
  overnemen naar `components/`, met echte state (SignalR, server-authoritative)
  in plaats van de mock-data uit de export.
- `RiskGame.Rules` blijft vrij van ASP.NET-, SignalR-, Marten-, I/O- en
  tijdafhankelijkheden zodat spelregels deterministisch testbaar zijn. Dobbelen
  loopt altijd via een injecteerbare `IRandomSource`, nooit `System.Random` direct
  (TO §4.2, §9).
- Speeldata in `data/` is de bron van waarheid voor territoria, adjacency, kleuren
  en kaartendeck; niet dupliceren of hardcoden in C# of TypeScript.
- **Kaart-projectie:** de SVG-overlay in `frontend/src/map/` moet exact dezelfde
  projectie gebruiken als `map-background-final.png` — lengtegraadbereik
  **−180° tot 191°** (niet het standaard −180°/180°), nodig omdat Kamchatka's
  oostpunt anders van het vasteland loskomt (TO §7.2). Bij afwijking vallen
  klikvlakken en achtergrond uit elkaar.
- Bij tegenstrijdigheden tussen FO/TO en een verzoek: meld het, kies niet zelf.

## Bouwvolgorde (TO §11)

1. `RiskGame.Rules` + `Rules.Tests` — los van transport/persistentie
2. Event sourcing (Marten) om de Rules-engine heen
3. `RiskGame.Api`: Minimal API + SignalR-hub
4. Frontend met placeholder-kaart (rechthoeken i.p.v. echte polygonen)
5. Echte kaartlaag: `map-background-final.png` + SVG-overlay
6. Reconnect & randgevallen

Niet vooruitwerken op een latere stap voordat de vorige stap tests heeft die slagen.

## NuGet

`Api.Tests` gebruikt alleen publieke NuGet-packages. `NuGet.Config` in de repo-root
sluit de privé Azure DevOps-feed (BluRedSelect) uit voor dit project — nooit die
feed toevoegen aan RiskGame-projecten.

## Commando's

```powershell
dotnet build RiskGame.sln
dotnet test RiskGame.sln
```

## Wijzigingen bijhouden

Nooit een los CHANGELOG.md, SUMMARY.md of vergelijkbaar bestand aanmaken of
bijwerken om wijzigingen te loggen. Git-commits zijn de enige changelog:
gebruik Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
met een korte titel + waarom in de body. Als een taak groot genoeg is om een
samenvatting te verdienen, hoort die in de commit message, niet in een bestand.

## Technische kaders per stack
Zie src/CLAUDE.md (SOLID/DRY/Clean Code) en frontend/CLAUDE.md.
(component-driven development) — automatisch actief als je in die map werkt.
Meld altijd wanneer je één van de twee documenten hebt gelezen.

## Werkwijze (agent-regie)

- **Eén taak per sessie, klein houden.** Een taak = één afgebakend stuk
  (bv. "DataLoader + connectiviteitstest"), niet "bouw de rules engine".
  Bij een taak die meer dan ~5 bestanden raakt: eerst een plan voorleggen
  (plan mode), dan pas implementeren.
- **Definition of done, altijd:** `dotnet build` groen, `dotnet test` groen,
  en (bij frontend-werk) `pnpm run build` groen. Een taak zonder geslaagde
  tests is niet af — ook niet "bijna af".
- **Geen nieuwe dependencies zonder overleg.** NuGet- of (p)npm-packages
  toevoegen alleen na expliciete goedkeuring, met motivatie waarom het niet
  zonder kan.
- **`data/*.json` is bevroren.** Nooit wijzigen zonder expliciete opdracht —
  deze bestanden zijn gevalideerde ontwerp-output, geen werkbestanden.
- **Geen TODO's of dode code achterlaten.** Iets dat niet af kan in deze
  taak wordt gemeld in de afronding, niet als `// TODO` in de code geparkeerd.
- **Bij twijfel over een spelregel: stoppen en vragen.** Nooit een regel
  "aannemelijk invullen" — het FO is compleet; als iets er niet in staat,
  is dat een bevinding, geen invulruimte.