# i18n-inventaris (Fase 0)

Scope: `frontend/src/**/*.{ts,tsx}`, exclusief `*.test.tsx`. Alle strings hieronder
zijn Nederlands en moeten via een key lopen (`nl` + `en`), tenzij expliciet
uitgesloten.

## Overzicht

- Bestanden met UI-tekst: 17
- Losse tekst-items (labels, headings, foutmeldingen, aria/placeholder, …): **~95**
- Backend-afkomstige strings (niet in `src/`, wél zichtbaar in UI): zie §3
- Hardcoded locale-calls: **0** gevonden (geen `toLocaleDateString`/`Intl.*` in de code)
- String-concatenatie/template literals met UI-tekst die interpolatie nodig hebben: §4

---

## 1. UI-copy per bestand (voorgestelde key → tekst)

### `components/TvUrlPanel.tsx`
| Key | Tekst |
|---|---|
| `lobby:tvUrl.eyebrow` | "Open op de TV" |

### `components/LobbySettingsSummary.tsx`
| Key | Tekst |
|---|---|
| `lobby:settings.winCondition.worldDomination` | "Werelddominantie" |
| `lobby:settings.winCondition.secretMissions` | "Geheime missies" |
| `lobby:settings.setupMode.random` | "Random" |
| `lobby:settings.setupMode.claiming` | "Claimen" |
| `lobby:settings.roleAssignment.random` | "Random" |
| `lobby:settings.roleAssignment.choose` | "Kiezen" |
| `lobby:settings.rows.winCondition` | "Winconditie" |
| `lobby:settings.rows.setupMode` | "Startopstelling" |
| `lobby:settings.rows.startingArmies` | "Startlegers" |
| `lobby:settings.rows.turnTimer` | "Beurttimer" |
| `lobby:settings.rows.fortifyTimer` | "Verplaatsen-timer" |
| `lobby:settings.rows.roles` | "Rollen" |
| `lobby:settings.rows.events` | "Gebeurtenisronde" |
| `common:states.off` | "Uit" |
| `common:states.on` | "Aan" |
| `lobby:settings.eyebrow` | "Instellingen" |
| `common:units.minutesShort` | "min" (in `formatTimer`, i.c.m. getal — interpolatie, zie §4) |

Let op: dit zijn **labels voor backend-enums** (`WinConditionDto`, `SetupModeDto`,
`RoleAssignmentModeDto`). De enum-waarde zelf komt van de server (`int`), dus dit
blijft prima een frontend-keyed lookup — het is geen vrije backend-tekst. Zie §3
voor het onderscheid met `PlayerColorDto.name` / `RoleSummaryDto.name`, die wél
al als tekst van de server komen.

### `components/CreateGameForm.tsx`
| Key | Tekst |
|---|---|
| `createGame:header.kicker` | "Nieuw spel" |
| `createGame:header.hostBadge` | "HOST" |
| `createGame:header.title` | "Instellingen" |
| `createGame:section.rules` | "Spelregels" |
| `createGame:map.title` | "Kaart" |
| `createGame:map.description` | "Bepaalt het aantal gebieden en de continentbonussen — kies daarom als eerste." |
| `createGame:map.standardName` | "Standaard" |
| `createGame:map.standardStats` | "43 gebieden · 6 continenten" |
| `createGame:map.standardDescription` | "De vertrouwde wereldkaart, gebalanceerd voor 2-6 spelers." |
| `createGame:winCondition.sectionHint` | "Winconditie (meerdere mogelijk)" |
| `createGame:winCondition.worldDomination.title` | "Werelddominantie" |
| `createGame:winCondition.worldDomination.description` | "Verover alle gebieden." |
| `createGame:winCondition.secretMissions.title` | "Geheime missies" |
| `createGame:winCondition.secretMissions.description` | "Iedere speler een geheime opdracht." |
| `createGame:setupMode.title` | "Startopstelling" |
| `createGame:setupMode.description` | "Hoe worden gebieden verdeeld?" |
| `createGame:setupMode.random` | "Random" |
| `createGame:setupMode.claiming` | "Claimen" |
| `createGame:startingArmies.label` | "Startlegers" |
| `createGame:startingArmies.sub` | "Per speler · aantal spelers nog onbekend" |
| `createGame:turnTimer.label` | "Beurttimer" |
| `createGame:turnTimer.sub` | "Per beurt (Versterken + Aanvallen)." |
| `createGame:section.extras` | "Extra spelelementen" |
| `createGame:roles.label` | "Rollen" |
| `createGame:roles.sub` | "Openbare rol + herkomstland-bonus." |
| `createGame:events.label` | "Gebeurtenisronde" |
| `createGame:events.sub` | "Gebeurteniskaart na elke ronde." |
| `createGame:teams.label` | "Teamspel" |
| `createGame:teams.sub` | "Bondgenootschappen — binnenkort." |
| `createGame:submit.busy` | "Bezig…" |
| `createGame:submit.idle` | "Spel aanmaken" |
| `createGame:errors.createFailed` | "Spel aanmaken is mislukt." (fallback bij lege server-errorlijst) |
| `createGame:errors.connection` | "Kon geen verbinding maken met de server." |

De `errors?.join(' | ')`-server-errorlijst (regel 68-69) is een **losse Fase-3
kwestie**: dit zijn nu vrije backend-strings (waarschijnlijk FluentValidation- of
ModelState-berichten), niet foutcodes. Zie §3.

### `components/JoinNameStep.tsx`
| Key | Tekst |
|---|---|
| `join:name.title` | "Hoe heet je?" |
| `join:name.placeholder` | "Jouw naam" |
| `common:actions.next` | "Volgende ›" |

### `components/JoinColorStep.tsx`
| Key | Tekst |
|---|---|
| `join:color.title` | "Kies je kleur" |
| `join:color.taken` | "Bezet" |

(`color.name` zelf is backend-data, zie §3.)

### `components/JoinRoleStep.tsx`
| Key | Tekst |
|---|---|
| `join:role.title` | "Kies je rol" |
| `join:role.ariaLabel` | "Kies je rol" (aria-label, zelfde tekst als title) |
| `join:role.taken` | "Bezet" |

(`role.name` / `role.description` zijn backend-data, zie §3.)

### `components/JoinWaitStep.tsx`
| Key | Tekst |
|---|---|
| `join:wait.title` | "Je bent aangemeld" |
| `join:wait.noColor` | "geen kleur" (fallback als `color` null is) |
| `join:wait.playersPresent` | "{{count}} spelers aanwezig" (interpolatie + mogelijk `_one`/`_other`, zie §4) |
| `join:wait.startGame` | "Spel starten" |
| `join:wait.waitingForPlayers` | "Wachten tot alle spelers klaar zijn (minimaal aantal spelers, iedereen heeft een kleur gekozen)." |
| `join:wait.waitingForHost` | "Wachten tot de host het spel start…" |

### `components/OrderRollWaitStep.tsx`
| Key | Tekst |
|---|---|
| `orderRoll:wait.title` | "Spelersvolgorde bepalen" |
| `orderRoll:wait.notRolledYet` | "Je hebt nog niet gegooid." |
| `orderRoll:wait.rollButton` | "Gooien" |
| `orderRoll:wait.waitingForOthers` | "Wachten op andere spelers…" |

### `components/OrderRollTvPanel.tsx`
| Key | Tekst |
|---|---|
| `orderRoll:tv.eyebrow` | "Spelersvolgorde bepalen" |
| `orderRoll:tv.total` | "Totaal: {{total}}" (interpolatie, zie §4) |
| `orderRoll:tv.waitingForRoll` | "Wacht op worp…" |

### `components/TvPageHeader.tsx`
| Key | Tekst |
|---|---|
| `tv:header.title` | "OPERATIE ATLAS" |
| `tv:header.subtitle` | "CAMPAGNE-TERMINAL" |

(`badge`-prop is losse tekst die de caller meegeeft — zie de aanroepende routes.)

### `components/LobbyPlayerList.tsx`
| Key | Tekst |
|---|---|
| `lobby:players.eyebrow` | "Spelers" |
| `lobby:players.noColor` | "Nog geen kleur" |
| `lobby:players.waitingForPlayer` | "Wachten op speler" |

(`{players.length} / {maxPlayers}` is getallen, geen copy — geen key nodig, wel
via `useLocale`/`Intl.NumberFormat` als het ooit duizendtal-notatie krijgt; nu
puur `number / number` en niet lokaal-gevoelig.)

### `components/LobbyQrPanel.tsx`
| Key | Tekst |
|---|---|
| `lobby:qr.ariaLabel` | "QR-code om te joinen op {{url}}" (interpolatie) |
| `lobby:qr.scanToJoin` | "Scan om te joinen" |

### `routes/phone/HomePage.tsx`
| Key | Tekst |
|---|---|
| `home:title` | "OPERATIE ATLAS" |
| `home:tagline` | "Verover de wereld — één telefoon per veldheer." |
| `home:joinCode.title` | "Spelcode" |
| `home:joinCode.placeholder` | "bv. ATLAS7" |
| `common:actions.join` | "Deelnemen" |
| `home:createCard.title` | "Nieuw spel starten" |
| `home:createCard.description` | "Jij wordt de host en stelt het spel in." |
| `home:joinCard.title` | "Deelnemen aan een spel" |
| `home:joinCard.description` | "Scan de QR-code op de TV." |
| `home:footer.playerCount` | "2 t/m 7 spelers · lokaal netwerk" |

### `routes/phone/PhonePage.tsx`
| Key | Tekst |
|---|---|
| `phone:boardPlaceholder` | "Spel is gestart — het spelbord volgt in een latere bouwplak." |

(Dit is een tijdelijke placeholder-tekst voor een stap die nog niet gebouwd is —
blijft toch een key, geen aparte behandeling nodig.)

### `routes/tv/TvPage.tsx`
| Key | Tekst |
|---|---|
| `tv:unknownGame` | "Onbekend spel." |
| `tv:connecting` | "Verbinden…" |
| `tv:boardPlaceholder` | "Spel is gestart — het bord volgt in een latere bouwplak." |
| `tv:badge.orderRoll` | "Spelersvolgorde" (badge-prop doorgegeven aan `TvPageHeader`) |
| `tv:badge.lobby` | "Wachtkamer" |

### `components/ui/ToggleRow.tsx`
| Key | Tekst |
|---|---|
| `common:badges.comingSoon` | "binnenkort" |

(`label`/`sub` zijn props, al gekeyed bij de aanroeper.)

### `components/ui/Stepper.tsx`
| Key | Tekst |
|---|---|
| `common:stepper.decreaseAriaLabel` | "{{label}} verlagen" (interpolatie) |
| `common:stepper.increaseAriaLabel` | "{{label}} verhogen" (interpolatie) |

### `components/ui/Dice.tsx`
| Key | Tekst |
|---|---|
| `common:dice.ariaLabel` | "Dobbelsteen {{value}}" (interpolatie) |

### `components/ui/PlayerHeader.tsx`
| Key | Tekst |
|---|---|
| `common:playerHeader.myCards` | "Mijn kaarten" |
| `common:playerHeader.myMission` | "Mijn missie" |
| `common:playerHeader.gameInfo` | "Spelinfo" |
| `common:playerHeader.turnTime` | "Beurttijd" |
| `common:playerHeader.settingsAriaLabel` | "Instellingen" |

Let op: dit component wordt (nog) nergens aangeroepen (`status`/`timer`-props
zijn placeholders volgens de eigen doc-comment) — check bij migratie of hij al
in gebruik is genomen.

### `hooks/useSignalR.ts`
| Key | Tekst |
|---|---|
| — | `throw new Error('useSignalR moet binnen <GameHubProvider> gebruikt worden')` — **developer-facing**, bereikt nooit de UI. Niet keyen (uitgesloten per instructie). |

### `hooks/GameHubProvider.tsx`
| Key | Tekst |
|---|---|
| — | `console.error('[GameHub] start mislukt', err)` — **developer-facing log**, niet keyen. |

---

## 2. Data, geen UI-copy (niet keyen)

- `PlayerDto.name` — spelernaam, door de speler zelf ingevoerd.
- `gameId` / join-code, QR-payload-URL.
- CSS class-strings, `data-testid`, route-paths (`/tv/:gameId`, `/play/:gameId`), API-paths (`/games`, `/hubs/game`).
- Emoji/glyphs die puur icoon zijn (`🎖`, `🎴`, `🤝`, `✦`, `⌂`, `★`, `⚙`, `✓`, `›`, `−`/`+`) — geen te vertalen tekst, wel `aria-hidden` waar van toepassing (al zo).
- `ColorSymbol`-glyphs (`●■▲◆★⬡✚`) — symbolisch, geen tekst.

## 3. Strings die van de backend komen (Fase 3 — buiten deze frontend-scan)

Deze tekst staat niet in `src/`, maar verschijnt wél onvertaald in de UI. Ze
komen uit `RiskGame.Api`-DTO's, die op hun beurt uit `data/*.json` lezen:

1. **`PlayerColorDto.name`** (bv. "Rood", "Blauw", …) — getoond in
   `JoinColorStep`, `LobbyPlayerList`, `JoinWaitStep`. Bron: `data/colors.json`.
2. **`RoleSummaryDto.name`** en **`RoleSummaryDto.description`** — getoond in
   `JoinRoleStep`, `LobbyPlayerList`, `JoinWaitStep`. Bron: vermoedelijk
   `data/roles.json` of vergelijkbaar.
3. **Server-validatiefouten**: `CreateGameForm.tsx` regel 68
   (`errors?.join(' | ')`) rendert een array van vrije server-strings direct.
   Ook `useGameState`/`useTvGame` zetten `error.message` van een mislukte
   hub-invoke (bv. `RejoinGame`, `JoinGame`, …) direct in `error`-state, die de
   componenten tonen (`JoinNameStep error=`, `Footer error=`, etc.) — dit zijn
   op dit moment **rauwe .NET-exception-messages**, geen foutcodes.
4. `SelectableOption`/`JoinRoleStep` `aria-label="Kies je rol"` is frontend-eigen
   (dubbel met de title), geen backend-tekst — alleen hier vermeld omdat het op
   dezelfde plek staat.

**Consequentie voor Fase 3** (contract-document + backend-wijziging): punt 1 en 2
vereisen dat `data/colors.json` (en de rollen-databron) een taalneutrale `code`
of `key` krijgen naast — of in plaats van — de huidige `name`/`description`
vrije tekst, plus een `RiskGame.Api`-wijziging om die key te versturen. Beide
bronnen zijn in dit project **bevroren** (`data/*.json`, zie CLAUDE.md) en de
DTO's leven in `RiskGame.Api`, niet in `frontend/`. Dit kan niet zonder
expliciete opdracht/review — zie sectie "Bevindingen" onderaan.

Punt 3 (losse foutmeldingen) vereist een `errorCode` op de hub-methoden en op de
`POST /games`-validatie-respons in plaats van vrije tekst — ook een
`RiskGame.Api`-wijziging.

## 4. Concatenatie / template literals die interpolatie worden

| Plek | Huidige vorm | Wordt |
|---|---|---|
| `LobbySettingsSummary.formatTimer` | `` `${minutes} min` `` / `` `${minutes}:${rest} min` `` | Getal via `useLocale`, "min"-suffix als key; of blijft functioneel format (geen vertaalbare tekst, enkel eenheid "min" moet key worden) |
| `CreateGameForm.formatTimer` | `` `${minutes}:${rest}` `` | Puur cijfer-formatting, geen tekst — geen key nodig |
| `JoinWaitStep` | `` `${joinedCount} spelers aanwezig` `` (JSX, geen literal template maar wel samengestelde tekst) | `t('join:wait.playersPresent', { count: joinedCount })` met `_one`/`_other` |
| `LobbyQrPanel` | `` `QR-code om te joinen op ${joinUrl}` `` | `t('lobby:qr.ariaLabel', { url: joinUrl })` |
| `Stepper` aria-labels | `` `${label} verlagen` `` / `` `${label} verhogen` `` | interpolatie met `{{label}}` |
| `Dice` aria-label | `` `Dobbelsteen ${value}` `` | interpolatie met `{{value}}` |
| `OrderRollTvPanel` | `Totaal: {dice[0] + dice[1]}` (JSX-expressie) | `t('orderRoll:tv.total', { total: dice[0]+dice[1] })` |
| `LobbyPlayerList` | `` `${role.name}` `` toegevoegd aan kleur-string via `` ` · ${role.name}` `` | dit is databron (rolnaam), niet copy — join-logica blijft, alleen de "·"-separator is puur presentational, geen key nodig |

## 5. Hardcoded locale in formatting-calls

Geen gevonden. Er is nergens `toLocaleDateString`, `toLocaleString`, `Intl.DateTimeFormat`
of `Intl.NumberFormat` met een hardcoded taalcode in de huidige `frontend/src`.
`useLocale()` (Fase 1) heeft dus nu geen bestaande call-sites om te vervangen —
wel relevant zodra beurttimers/datums worden toegevoegd in een latere bouwstap.

## 6. `index.html`

`<html lang="en">` en `<title>frontend</title>` zijn geen React-copy maar horen
wel bij i18n: `lang` moet meebewegen met de actieve taal (Fase 1 init-eis "update
`document.documentElement.lang`" dekt dit al na de eerste render, maar de
initiële SSR-loze `lang="en"`/titel zijn zelf ook hardcoded en taalneutraal fout
— "frontend" als title is sowieso een placeholder, geen vertaalvraagstuk op zich).

## Needs review

Geen — alle Nederlandse teksten hierboven zijn ondubbelzinnig genoeg om zelf een
natuurlijke Engelse vertaling te schrijven in Fase 2. Twee punten die wél
menselijke input nodig hebben, niet omdat de vertaling onduidelijk is maar omdat
de **backend-aanpak** een ontwerpbeslissing is (geen tekst-kwestie):

- Hoe de `errorCode`-contractwijziging voor server-validatiefouten en
  hub-invoke-fouten eruit moet zien (Fase 3, punt 3 hierboven).
- Of/wanneer `data/colors.json` en de rollen-databron een taalneutrale `code`
  krijgen naast `name`/`description` (Fase 3, punt 1-2 hierboven) — dit raakt
  bevroren speeldata.

---

## Bevindingen (buiten de scope van "tekst vervangen door keys")

1. **Nieuwe dependencies**: deze taak vereist `i18next`, `react-i18next`,
   `i18next-browser-languagedetector` (Fase 1) en later `eslint-plugin-i18next`
   (Fase 4). Project-afspraak: "Geen nieuwe dependencies zonder overleg." — nog
   niet geïnstalleerd, wacht op akkoord.
2. **Taakomvang**: dit raakt naar schatting 20+ bestanden in `frontend/src`, plus
   nieuwe infra-bestanden, plus (optioneel, Fase 3/4) wijzigingen in
   `RiskGame.Api` en `data/*.json`. Project-afspraak: "Eén taak per sessie, klein
   houden" en "plan mode" bij >5 bestanden — dit plan moet in stukken (bv. per
   Fase, of per feature binnen Fase 2) uitgevoerd worden, niet in één sessie.
3. **`data/*.json` is bevroren** — Fase 3 kan niet zonder expliciete opdracht om
   een `code`-veld toe te voegen aan de kleuren-/rollen-data.
4. Backend-wijzigingen (DTO's, hub-foutafhandeling) vallen buiten `frontend/`
   en dus buiten wat dit i18n-migratieplan zelf kan uitvoeren zonder
   gecoördineerde backend-taak.
