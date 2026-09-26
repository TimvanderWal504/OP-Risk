# Azure App Service + Neon + Vercel — deployment runbook

**Hoort bij:** `functioneel-ontwerp-risk.md` §12 · **Status:** uitgevoerd op 2026-09-20
(`op-risk-game.azurewebsites.net` in `westeurope`, `op-risk-kappa.vercel.app`) — zie de
noten hieronder voor drie punten waar de praktijk afweek van de oorspronkelijke aanname.

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
   bij Neon.
4. **Let op — geconstateerd bij de eerste deploy (2026-09-20):** Neon levert de
   string in libpq/URI-vorm (`postgresql://user:pass@host/db?sslmode=require`).
   Npgsql/Marten accepteren die vorm **niet**: `NpgsqlConnectionStringBuilder`
   gooit een `KeyNotFoundException` ("Couldn't set postgresql://...") zodra de
   store een connectie probeert te openen. Zet de string eerst om naar het
   ADO.NET key=value-formaat voordat je hem in App Service zet (zie §3):
   ```
   Host=<ep-....neon.tech>;Port=5432;Database=<db>;Username=<user>;Password=<wachtwoord>;SSL Mode=Require
   ```

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

**Let op — regio-quota (geconstateerd bij de eerste deploy, 2026-09-20):** op een
Visual Studio Enterprise-subscription staat vaak een quota van **0 Basic-VM's**
in `uksouth` (en mogelijk andere regio's), ongeacht of de gebruiker is ingelogd.
`az appservice plan create` faalt dan met "Operation cannot be completed without
additional quota". Dit is regio-specifiek — `westeurope` had in dit geval wél
quota. Als de gekozen regio faalt: probeer `westeurope`, of vraag een
quota-verhoging aan via Azure Portal → Quotas (kan uren tot een dag duren). Dit
verklaart waarom deze runbook `westeurope` als regio aanhoudt ondanks dat Neon
in `eu-west-2` (Londen) staat — de latency-impact Amsterdam↔Londen is in de
praktijk verwaarloosbaar voor een turn-based spel.

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
  ConnectionStrings__Postgres="Host=<ep-....neon.tech>;Port=5432;Database=<db>;Username=<user>;Password=<wachtwoord>;SSL Mode=Require" \
  AllowedOrigin="https://<vercel-app>.vercel.app" \
  ASPNETCORE_ENVIRONMENT=Production
```

**Niet** de rauwe Neon-URI (`postgresql://...?sslmode=require`) gebruiken — zie de
noot in §2.4.

`ConnectionStrings__Postgres` (dubbele underscore) mapt op ASP.NET Core's
standaard configuratie-conventie naar `ConnectionStrings:Postgres` — geen
`appsettings.Production.json` nodig.

Health check: **Configuration → Health check**, pad `/health`.

Deployen (eerste keer handmatig, zip-deploy van een `dotnet publish`-output):

```
dotnet publish src/RiskGame.Api -c Release -o ./publish
cd publish && zip -r ../publish.zip . && cd ..
az webapp deploy --name <app-naam> --resource-group riskop-rg --src-path publish.zip --type zip --clean true
```

**Let op — zip op Windows (geconstateerd bij de eerste deploy, 2026-09-20):**
zonder een Unix-achtige `zip`-tool (bv. binnen Git Bash zonder `zip` geïnstalleerd)
is de verleiding om PowerShell's `Compress-Archive` te gebruiken. **Doe dat niet**
— `Compress-Archive` schrijft backslashes als padscheidingsteken in de
zip-entries (`data\maps\standaard-43\cards.json` i.p.v. `data/maps/standaard-43/cards.json`).
Kudu's `rsync`-gebaseerde deploy op de Linux-kant van App Service interpreteert
dat pad dan als één bestandsnaam met letterlijke backslashes, en faalt met
`rsync: ... failed to stat "...": Invalid argument (22)`. Bouw de zip in plaats
daarvan met .NET's `ZipArchive`, die met expliciete forward-slash paden werkt:

```powershell
Add-Type -AssemblyName System.IO.Compression
$sourceDir = (Resolve-Path .\publish).Path
$zip = [System.IO.Compression.ZipFile]::Open("publish.zip", [System.IO.Compression.ZipArchiveMode]::Create)
Get-ChildItem -Path $sourceDir -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourceDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}
$zip.Dispose()
```

Gebruik daarnaast `--clean true` op `az webapp deploy` (zoals hierboven): een
eerdere mislukte deploy met kapotte backslash-paden laat resten achter in
`/home/site/wwwroot` die een volgende, wél correcte deploy alsnog laten
struikelen als je niet expliciet opschoont.

Na de eenmalige inrichting hieronder (§3a) is handmatig deployen alleen nog nodig
als noodgreep of rollback (§7).

---

## 3a. Automatische deploy vanuit GitHub Actions

De job `deploy-backend` in `.github/workflows/ci.yml` zet de backend live bij elke
**push naar `main`**, maar alleen als de job `backend` (build + alle tests) groen is.
Pull requests en andere branches deployen nooit. Hij doet hetzelfde als de handmatige
stappen in §3 (`dotnet publish`, zip met forward slashes, zip-deploy met clean) en
wacht daarna tot `/health` weer 200 geeft. De frontend heeft geen eigen stap: Vercel
deployt `main` zelf.

Inloggen bij Azure gaat via **OIDC** (federated credential): GitHub krijgt per run een
kortlevend token, er staat geen wachtwoord of publish profile als secret in GitHub. Dat
werkt ook als "Basic auth publishing credentials" op de App Service uit staat (de
standaard voor nieuwe App Services).

Eenmalig inrichten (Azure CLI, ingelogd met `az login`; `<app-naam>` = de App Service
uit §3):

```
az ad app create --display-name riskop-github-deploy --query appId -o tsv
# → noteer de appId als <client-id>
az ad sp create --id <client-id>
```

Maak `credential.json` met precies deze inhoud (het `subject` bindt het token aan de
GitHub-environment `production` van deze repo — de job draait in die environment):

```json
{
  "name": "github-production",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:TimvanderWal504@21218731/OP-Risk@1307955318:environment:production",
  "audiences": ["api://AzureADTokenExchange"]
}
```

**Let op — subject-vorm (geconstateerd bij de eerste automatische deploy, 2026-09-26):**
GitHub zet de owner- en repo-ID in het `subject` (`<owner>@<owner-id>/<repo>@<repo-id>`),
niet alleen de namen. Het kortere `repo:TimvanderWal504/OP-Risk:…` matcht dan niet en de
login faalt met `AADSTS700213`. Het exacte subject staat in de log van de stap
`azure/login` ("subject claim - …"); de ID's zijn op te vragen met
`gh api repos/TimvanderWal504/OP-Risk --jq '"\(.owner.id) \(.id)"'`.

```
az ad app federated-credential create --id <client-id> --parameters credential.json
az role assignment create --assignee <client-id> --role "Website Contributor" --scope $(az webapp show --name <app-naam> --resource-group riskop-rg --query id -o tsv)
az account show --query "{tenant:tenantId, subscription:id}" -o json
```

In PowerShell werkt de `$( … )`-substitutie ook; anders eerst de `az webapp show`-uitvoer
in een variabele zetten. De rol staat bewust op de ene App Service, niet op de resource
group of subscription.

Daarna in GitHub (**Settings → Secrets and variables → Actions**):

| Soort | Naam | Waarde |
| --- | --- | --- |
| Secret | `AZURE_CLIENT_ID` | `<client-id>` |
| Secret | `AZURE_TENANT_ID` | `tenant` uit de laatste opdracht |
| Secret | `AZURE_SUBSCRIPTION_ID` | `subscription` uit de laatste opdracht |
| Variable | `AZURE_WEBAPP_NAME` | `<app-naam>` (zonder `.azurewebsites.net`) |

De environment `production` maakt GitHub bij de eerste run zelf aan. Wil je dat een
deploy eerst goedgekeurd moet worden: **Settings → Environments → production →
Required reviewers**.

Controle: kijk na de eerstvolgende push naar `main` in het tabblad
**Actions** of `deploy-backend` groen wordt; de environment-link in die run opent de API.
Faalt de login met `AADSTS70021`/`AADSTS700213` (geen passende federated credential),
dan klopt het `subject` niet — vergelijk het letterlijk (inclusief hoofdletters en de
`@<id>`-delen) met de "subject claim" in de log van de stap `azure/login`.

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
