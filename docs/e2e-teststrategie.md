# E2E-teststrategie (Playwright) — bevindingen en plan

**Status:** nog niet uitgevoerd. TO §9 plaatst Playwright-E2E expliciet als latere
teststap; `frontend/src/map/` bevat op moment van schrijven alleen een
`.gitkeep` (bouwstap 4, echte kaartlaag, is nog niet gebouwd) en
reconnect-afhandeling (bouwstap 5/6) bestaat nog niet. Dit document legt vast
wat er bij oriëntatie is gevonden en wat het plan is, zodat een latere sessie
niet opnieuw hoeft te graven. Er is bewust nog niets geïmplementeerd — zie
"Open vraag" onderaan.

## Fase 0 — oriëntatie

- **Backend:** .NET 10 Minimal API (`src/RiskGame.Api/Program.cs`) + SignalR-hub
  (`src/RiskGame.Api/Hubs/GameHub.cs`). Eén REST-endpoint (`POST /games`,
  `src/RiskGame.Api/Endpoints/GameEndpoints.cs`); de rest van de spel-commando's
  loopt via de hub.
- **Persistentie:** Marten/PostgreSQL, event-sourced, inline projectie
  (`src/RiskGame.Persistence/Store/GameStoreFactory.cs`). Bestaande tests
  gebruiken al een echte, wegwerpbare Postgres via Testcontainers
  (`src/RiskGame.Api.Tests/PostgresFixture.cs`, `postgres:16-alpine` per
  testklasse) — geen mocks.
- **Frontend:** React 19 + Vite + react-router-dom + i18next
  (`frontend/package.json`, `frontend/src/main.tsx`). Routes: `/`
  (HomePage, host/join-keuze), `/tv/:gameId`, `/play/:gameId`. Dev-server
  proxy't `/hubs` en `/games` naar `http://localhost:5001`
  (`frontend/vite.config.ts`).
- **Authenticatie:** geen. Geen auth-middleware in `Program.cs`, spelers
  identificeren zich alleen via een `gameId` in de URL.
- **Externe afhankelijkheden:** geen gevonden — geen uitgaande HTTP-calls
  vanuit `RiskGame.Api`.
- **CI:** `.github/workflows/ci.yml` draait nu `dotnet build/test` en
  `pnpm lint/build`; geen E2E-stap.
- **Bestaande E2E-tooling:** geen Playwright/Cypress/Selenium-restanten in de
  repo. Wel één expliciete vermelding in `docs/technisch-ontwerp-risk.md` §9:
  *"E2E (later) | Playwright over de echte frontend; reconnect-scenario's
  expliciet."*

## Fase 1 — strategie

### Journey-inventaris (referentie, nog niet compleet)

| Journey | Verdict | Onderbouwing |
| --- | --- | --- |
| Speler maakt spel aan via HomePage → CreateGameForm → TV toont lobby | IMPORTANT (later) | Kruist browser, REST (`POST /games`) en SignalR-lobby-state; pas zinvol als losse E2E-test zodra de kaart-journeys er ook zijn. |
| Speler joint via code op HomePage → telefoon verschijnt in TV-lobby | IMPORTANT (later) | Zelfde reden. |
| Order-roll-scherm toont juiste beurtvolgorde na dobbelen | LOWER LEVEL | Puur weergave van server-berekende state; al gedekt door `GameHubOrderRollTests.cs`. |
| Aanval/verdediging op de echte kaart | OUT OF SCOPE (nu) | Er is nog geen kaart (`frontend/src/map/` is leeg) om te testen. |
| Reconnect na verbroken verbinding | OUT OF SCOPE (nu) | TO §9 noemt dit expliciet als aparte, latere bouwstap; er is nog geen reconnect-logica. |

Conclusie: geen enkele journey is nu de moeite waard om als E2E-test te
implementeren. Journey-implementatie (fase 3 van de aanpak) blijft leeg tot
bouwstap 4 (echte kaartlaag) en 5/6 (reconnect) klaar zijn.

### Infrastructuurbeslissingen (voor als de tijd rijp is)

- **Database-isolatie:** Testcontainers, één Postgres-container per volledige
  testrun, uniek `gameId` per test (de API genereert dit al server-side via
  `GameIdGenerator`). Schema-per-worker en truncation zijn overwogen en
  afgewezen als onnodige complexiteit zolang elke test zijn eigen game
  aanmaakt.
- **Authenticatie:** niet van toepassing — geen auth-mechanisme aanwezig, dus
  geen `auth.setup.ts` / `storageState` nodig.
- **Externe afhankelijkheden:** geen gevonden, dus geen stubs nodig.
- **Omgevingsconfiguratie:** `webServer` in `playwright.config.ts` start zowel
  `dotnet run --project src/RiskGame.Api` als `pnpm --dir frontend dev`, tegen
  een Testcontainers-Postgres waarvan de connectiestring als
  `ConnectionStrings__Postgres` env var wordt doorgegeven — zelfde patroon als
  `PostgresFixture.cs`. De bestaande Vite-proxy (`localhost:5001`) blijft
  ongewijzigd.

### Bestandsplan (alleen harness, geen journeys — nog niet uitgevoerd)

| Bestand | Doel |
| --- | --- |
| `frontend/e2e/playwright.config.ts` | Playwright-config: `webServer` voor API+frontend, trace/screenshot/video, CI-only retries |
| `frontend/e2e/fixtures/postgres.ts` | Start/stopt een Testcontainers-Postgres voor de hele run |
| `frontend/e2e/smoke.spec.ts` | Eén triviale test: laadt HomePage, controleert titel zichtbaar — bewijst dat de harness werkt |
| `frontend/package.json` | `@playwright/test` als devDependency, `"e2e": "playwright test"`-script |

### Open vraag

`@playwright/test` is een nieuwe dependency — CLAUDE.md vereist hier
expliciete goedkeuring met motivatie voordat hij wordt toegevoegd. Motivatie:
het is de tool die de TO zelf al aanwijst (§9), en er is geen lichter
alternatief voor browser-niveau tests. Dit moet opnieuw bevestigd worden op
het moment dat fase 2 (harness bouwen) daadwerkelijk wordt opgepakt.
