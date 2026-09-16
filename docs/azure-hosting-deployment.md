# Azure App Service + Neon + Vercel — deployment runbook

**Hoort bij:** `functioneel-ontwerp-risk.md` §12 · **Status:** startklaar, nog niet uitgevoerd

---

## 1. Overzicht

```
[Vercel]                          [Azure App Service]                [Neon]
┌──────────────┐   HTTPS/WSS      ┌──────────────────────┐  TLS      ┌──────────────┐
│ React SPA     │─────────────────▶│ Basic B1 (Linux)      │──────────▶│ Postgres      │
│ (frontend/)   │  eigen origin    │ .NET API + SignalR-hub│  directe  │ (Marten-store)│
└──────────────┘                  └──────────────────────┘  connectie└──────────────┘
```

Drie losse origins, geen self-hosted componenten meer. Dit vervangt Plan B
(Proxmox/Tailscale Funnel) volledig — zie FO §12.

Deze runbook is **door de gebruiker zelf uit te voeren**: resource-provisioning
kost geld en vereist ingelogde Azure/Neon/Vercel-accounts, dus Claude voert dit
niet zelf uit. De repo-wijzigingen (CORS, forwarded-headers, `/health`, env-var-
gedreven frontend-URL's) staan al klaar; hieronder alleen nog de externe stappen.

---

## 2. Neon — project + database

1. Nieuw Neon-project aanmaken; kies een regio dicht bij de Azure App
   Service-regio om latency te beperken.
2. Haal de **directe/unpooled** connection string op (niet de pooled/PgBouncer-
   variant) — met één always-on App Service-instance is er geen pooling-laag
   nodig, en dit vermijdt de bekende Marten/PgBouncer-transactiemodus-
   compatibiliteitsvragen rond prepared statements.
3. Bevestig dat de string `sslmode=require` (of `verify-full`) bevat — standaard
   bij Neon, en Npgsql/Marten accepteren dat rechtstreeks in de connection
   string zonder extra code.

---

## 3. Azure App Service — aanmaken + configureren

```
az group create --name riskop-rg --location westeurope
az appservice plan create --name riskop-plan --resource-group riskop-rg --sku B1 --is-linux
az webapp create --name <app-naam> --resource-group riskop-rg --plan riskop-plan --runtime "DOTNETCORE:10.0"
```

Controleer de exacte runtime-identifier vooraf met `az webapp list-runtimes --os linux`
— niet blind aannemen dat `DOTNETCORE:10.0` de juiste string is op het moment van
uitvoeren. Staat er geen .NET 10-optie tussen, dan is een Dockerfile + container-
deploy het alternatief — dat is een grotere wijziging dan deze runbook aanneemt,
dus eerst terugkoppelen voordat je die kant op gaat.

Configuratie:

```
az webapp config set --name <app-naam> --resource-group riskop-rg --always-on true
az webapp config set --name <app-naam> --resource-group riskop-rg --web-sockets-enabled true
```

- **Always On**: voorkomt dat de enige instance idle wordt uitgeschakeld, wat
  `TurnTimerBackgroundService` en lopende SignalR-verbindingen zou raken.
- **Web sockets**: staat standaard uit; zonder deze toggle valt SignalR terug op
  long-polling.

Application Settings (env vars):

```
az webapp config appsettings set --name <app-naam> --resource-group riskop-rg --settings \
  ConnectionStrings__Postgres="<Neon directe connection string>" \
  AllowedOrigin="https://<vercel-app>.vercel.app" \
  ASPNETCORE_ENVIRONMENT=Production
```

`ConnectionStrings__Postgres` (dubbele underscore) mapt op ASP.NET Core's
standaard configuratie-conventie naar `ConnectionStrings:Postgres` — geen
`appsettings.Production.json` nodig.

Health check: **Configuration → Health check**, pad `/health`.

Deployen (eerste keer handmatig, zip-deploy van een `dotnet publish`-output):

```
dotnet publish src/RiskGame.Api -c Release -o ./publish
cd publish && zip -r ../publish.zip . && cd ..
az webapp deploy --name <app-naam> --resource-group riskop-rg --src-path publish.zip --type zip
```

Een geautomatiseerde deploy-stap in `.github/workflows/ci.yml` bestaat nog niet
— dat is bewust buiten scope van deze taak gehouden, geen vergeten stap.

---

## 4. Vercel — project + env var

1. Repo importeren in Vercel; **root directory instellen op `frontend/`**.
2. Framework-preset bevestigen als Vite (build command `pnpm run build`, output
   `dist` — Vercel detecteert dit doorgaans automatisch).
3. Environment Variables (Production, en Preview indien gewenst):
   - `VITE_API_URL` = `https://<app-naam>.azurewebsites.net`
4. `frontend/vercel.json` regelt de SPA-fallback (client-side routes van
   tv/phone-schermen blijven werken bij direct navigeren/verversen) — controleer
   na de eerste deploy of een directe URL naar een niet-root-route (bv.
   `/tv`) ook zonder eerst via `/` te navigeren laadt.

---

## 5. Verificatie na deploy

- Open de Vercel-URL, maak een spel aan (`POST /games`) en controleer in de
  browser devtools-network-tab dat er geen CORS-fouten optreden.
- Controleer dat de SignalR-hubverbinding (`/hubs/game`) daadwerkelijk als
  WebSocket opzet (niet long-polling) — devtools-network-tab, type "websocket".
- Join met meerdere "spelers" (verschillende browsers/devices) kort na elkaar
  en bevestig dat `JoinGameRateLimitFilter` per échte client-IP telt, niet alles
  onder één (Azure-proxy-)adres bucket't — zie TO §8.
- `curl https://<app-naam>.azurewebsites.net/health` geeft 200 terug.

---

## 6. Kosten & teardown

Basic B1 (~€12-13/maand, regio-afhankelijk — exact bedrag vooraf bevestigen via
de Azure Pricing Calculator) en Neon's gekozen tier lopen beide door zolang de
resources bestaan. Vercel en Neon's kleinste tier zijn in de praktijk gratis op
dit verkeersniveau.

Opruimen:

```
az webapp delete --name <app-naam> --resource-group riskop-rg
az appservice plan delete --name riskop-plan --resource-group riskop-rg
```

plus het Neon-project en het Vercel-project verwijderen via hun eigen dashboards.

---

## 7. Rollback

Een mislukte deploy raakt alleen App Service (code/config) — Neon-data (Marten
events/projecties) overleeft dat onveranderd. Bij een gebroken deploy: vorige
`az webapp deploy`-artefact opnieuw deployen, of de App Service tijdelijk
stoppen (`az webapp stop`) zonder de database aan te raken.
