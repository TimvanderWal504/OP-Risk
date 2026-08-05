# TV-motion-inventarisatie — Host-scherm

**Doel:** elke waarneembare toestandsverandering op het host-scherm (TV) inventariseren als
invoer voor een motion-spec. Dit document bevat geen implementatie en geen nieuwe
timingwaarden — alleen wat er al vastligt in `motion.ts`/de export wordt geciteerd.

**Bronnen:** zie de opdracht. Volledige lijst gelezen bestanden staat in het antwoord
vóór dit document (routes/tv, hooks, types, betrokken components, `GameHub.cs`,
`GameStateDto.cs`/`GameStateDtoMapper.cs`, `motion.ts`, het (inmiddels verwijderde)
oorspronkelijke TV-design inclusief de demo-state-JS, FO en TO volledig).

**Statusnotitie vooraf:** `TvPage.tsx` implementeert `Lobby`, `OrderRoll` en — sinds de
Reinforce-taak — het "Main board"-deel van `InProgress` (`TvMainBoardScreen`). `Claiming`,
`InitialPlacement` en `Finished` vallen nog terug op dezelfde generieke placeholder-tekst; de
sub-toestanden van `InProgress` buiten Main board (Region select/Combat/Event/Elimination,
het rechterspelerspaneel, de feed-strip) bestaan ook nog niet. De rijen hieronder voor al die
niet-gebouwde stukken zijn dus nog steeds **spec-only**, afgeleid uit het design-export
(demo-states 2–9) en FO/TO, en expliciet gemarkeerd als "niet geïmplementeerd".

---

## 1. Change inventory

### Lobby

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Spelersteller "X / maxPlayers" wijzigt | `players[]`-lengte verandert (`PlayerJoined`) | `LobbyPlayerList` (telling-span) | geen | per join, tot maxPlayers keer |
| Nieuwe spelerskaart verschijnt in grid | `players[]` krijgt een entry | `LobbyPlayerList` speler-kaart | geen — geen entrance-animatie in code of export voor dit element | per join |
| Aantal lege "wacht op speler"-slots neemt af | `emptySlots = maxPlayers - players.length` herberekend | `LobbyPlayerList` gestippelde slot | geen | per join |
| Kleursymbool verschijnt op spelerskaart | `player.colorId` gezet (`ColorChosen`) | `PlayerAvatar` in `LobbyPlayerList` | geen | per speler, mogelijk vaker als een speler van kleur mag wisselen vóór spelstart (zie vraag hieronder) |
| Rolnaam verschijnt naast kleur | `player.roleId` gezet (`RoleAssigned`/keuze), alleen bij Rollen=Aan+Kiezen | `LobbyPlayerList` rol-tekst | geen | 0 of 1 per speler, afhankelijk van instellingen |
| Wachtrij-stip pulseert continu | geen — statische lobby-toestand, niet event-gedreven | **niet geïmplementeerd** (wél in export, L88-90) | `tvAnimations.waitingDot` (`atlasDot`) | continu zolang `phase===Lobby` |
| QR-code rendert | `gameId` (routeparam, aanwezig bij mount, geen state-veld-wijziging) | `LobbyQrPanel` | geen | eenmalig, bij mount |
| Instellingen-samenvatting toont waarden | `settings`-object (vastgesteld vóór lobby ontstaat, FO §10) | `LobbySettingsSummary` | geen | effectief 0 wijzigingen binnen Lobby (zie vraag §5) |
| Badge/kicker-tekst | fase-entry (mount), niet een within-fase-wijziging | `TvPageHeader` | geen | eenmalig bij fase-intrede |

`availableColorIds` (krimpt bij elke `ColorChosen`) heeft geen eigen TV-weergave —
`LobbyPlayerList` toont alleen de gekozen kleur per speler, nooit de resterende pool.

### OrderRoll

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Dobbelstenenpaar van een speler verschijnt met waarden | `DiceRolledMessage` (`context: "order-roll"`) → `orderRollThrows[playerId]` gevuld | `OrderRollTvPanel` → `Dice` (×2 per speler) | `tvAnimations.orderRollDie(idx)` (`atlasTumble`, gestaggerd op spelersindex) | per speler eenmalig, vaker bij een tie-break-herworp |
| Leeg dobbelsteen-slot ("wacht op worp") wisselt naar gevulde dobbelstenen | zelfde als hierboven | `OrderRollTvPanel` (conditionele render) | geen overgang gedefinieerd tussen beide staten | per speler, per worp |
| Speelvolgorde-ranglijst verschijnt | `GameStateDto.turnOrder` niet-leeg (via `RollForOrder`-respons / `GameStateUpdated`) | `OrderRollTvPanel` ranglijst-blok | geen — geen entrance-animatie op de rank-kaarten in export of `motion.ts` | eenmalig per spel, kan verschuiven bij een latere herworp (zie §3) |
| Rang-1-kaart krijgt gouden styling | statische conditie `rank===0` t.o.v. andere rangen | `OrderRollTvPanel` rank-kaart | geen (directe class-wissel) | eenmalig, zodra order niet-leeg wordt |
| `orderRollState.playersStillToRoll` krimpt | server houdt bij wie nog moet gooien | **niet gerenderd** — `OrderRollTvPanel` leidt "wacht op worp" af uit afwezigheid van `throws[player.id]`, niet uit dit veld | n.v.t. | n.v.t. — bevinding, zie §5 |
| Tie-break: twee spelers gooien opnieuw, dezelfde dobbelsteen-slot krijgt nieuwe waarde | tweede `RollForOrder` + `DiceRolledMessage` voor de gelijk-geëindigde spelers | `OrderRollTvPanel`, zelfde `Dice`-element (geen nieuwe `key`) | `atlasTumble` is een mount-only `both`-animatie — **refire't niet** bij een props-only update, zie §2 | per tie |
| Fase blijft `OrderRoll` getoond terwijl server al is doorgeschoven | `useHeldPhase`, onafhankelijk van serverevents | `TvPage` fase-gate | n.v.t. | eenmalig per spel |
| Tie-verklarende tekst (export L134, "Blauw en Geel gooiden 12 — opnieuw gegooid…") | onbekend — geen DTO-veld gevonden dat deze narratieve tekst draagt | **niet geïmplementeerd**, ook geen brontekst in `orderRoll`-namespace gecontroleerd buiten de velden die `OrderRollTvPanel` al gebruikt | — | vraag, zie §5 |

### Claiming (spec-only, design-state 2 "Claim gebieden")

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Actieve-claimer-chip (icoon/naam/kleurwoord) in topbalk | `turnState.activePlayerId` wisselt naar volgende claimer | niet geïmplementeerd | geen (statische wissel) | per claim-beurt-rotatie (tot 43×) |
| Teller "X gebieden verdeeld" | aantal `territories[]` met `ownerPlayerId != null` | niet geïmplementeerd | geen | per `ClaimTerritory` |
| Gebiedspolygoon krijgt vulling/rand in claimende speler-kleur | `TerritoryDto.ownerPlayerId` gezet voor dat gebied | niet geïmplementeerd | geen geïdentificeerd | per gebied (tot 43×) |
| Geclaimd-marker (gekleurde cirkel + symbool) verschijnt op centroid | zelfde `ownerPlayerId`-wijziging | niet geïmplementeerd | geen | per gebied |
| Flare/burst-ring rond het laatst geclaimde gebied (`claimHasFlare`) | onduidelijk welk exact veld dit drijft — vermoedelijk het meest recente claim, transiënt | niet geïmplementeerd | `tvAnimations.burstShort` (`atlasBurst 1s`) | vraag: eenmalig per claim, of blijft zichtbaar (keyframe zelf is `infinite`)? |
| Rechterpaneel: geclaimd-aantal per speler | `territories.filter(o => o.ownerPlayerId === player.id).length` | niet geïmplementeerd | geen | per claim |
| Gouden linkerbalk-indicator op actieve-speler-rij | `turnState.activePlayerId` | niet geïmplementeerd | geen | per claim-beurt-rotatie |
| Faseovergang Claiming → volgende fase zodra alle 43 gebieden verdeeld zijn | `phase`-veld kantelt | screen-level, zie §4 | n.v.t. | eenmalig per spel |

### InitialPlacement (spec-only — géén eigen design-state, zie vraag)

FO §5.1 beschrijft deze fase (na random-verdeling of Claimen plaatsen spelers om beurten
hun resterende startlegers), maar de export heeft er geen apart demo-state voor. Rijen
hieronder zijn afgeleid uit `PlaceInitialArmy` en `TerritoryDto.armyCount`, expliciet als
inferentie gemarkeerd.

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Legeraantal op een gebied verhoogt met 1 | `territories[i].armyCount` wijzigt (`InitialArmyPlaced`) | vermoedelijk dezelfde territory-badge als "Main board" (export L275-283) — niet bevestigd | geen geïdentificeerd voor een enkele +1-mutatie | per `PlaceInitialArmy`-aanroep, dus (startlegers − eigen gebieden) keer per speler |
| Actieve-plaatser-indicator | `turnState.activePlayerId` rouleert | zelfde topbalk-chip als Claiming/Board | niet geïmplementeerd | per plaatsing |
| Resterende-startlegers-teller per speler | **geen DTO-veld gevonden** — `TurnStateDto.armiesRemaining` is qua doc-comment gekoppeld aan de Reinforce-fase, niet aan startopstelling | n.v.t. | n.v.t. | vraag, zie §5 (FO-gat) |

### InProgress (design-states 3–8: Main board / Region select / Combat / Event card / Event resolved / Player eliminated)

Dit is één `GamePhaseDto`-waarde met meerdere zichtbare sub-toestanden, gedreven door
`TurnStateDto`/transiënte overlays, niet door aparte fases. **Alleen "Main board" (topbalk +
kaart/gebiedslaag hieronder) is geïmplementeerd** (`TvMainBoardScreen` +
`TurnStatusHeader`, Reinforce-taak). Region select/Combat/Event/Elimination/het
rechterspelerspaneel/de feed-strip blijven **spec-only** zoals hieronder gedocumenteerd — eigen
taken (Attack e.v.), zie de rijen verderop.

**Topbalk (persistent tijdens InProgress) — geïmplementeerd**

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Actieve-speler-chip (icoon+naam+kleurwoord) | `turnState.activePlayerId` | `TurnStatusHeader` (gekeyed op `activePlayer.id`) | `tvAnimations.turnChipSwap` (`atlasTurnSwap`) | per beurt |
| Fase-pil-highlight (Versterken/Aanvallen/Verplaatsen) | `turnState.turnPhase` | `TurnStatusHeader` | `tvAnimations.phasePillPop` (`atlasPhasePop`) op de actieve pil | tot 3× per beurt |
| Timer-cijferwaarde | server-gezaghebbende aftelling, relatief geleverd via `TurnStateDto.timer.remainingMs` (`GameStateDtoMapper`, `TimeProvider`-gebaseerd) | `TurnStatusHeader` via `useCountdown` (monotone-anchor, her-ankert op elke nieuwe push) | `tvAnimations.timerSwap`/`timerLow` | continu client-side tussen twee `GameStateUpdated`-pushes, her-anker per push |
| Timer-visuele-staat (normaal → laag → gepauzeerd) | client-drempel `TIMER_LOW_THRESHOLD_MS=60s` (productbeslissing, niet uit de export — zie doc-comment in `TurnStatusHeader.tsx`, analoog aan `useHeldPhase`'s hold-duur) / `timer.isPaused` | `TurnStatusHeader` | `tvAnimations.timerLow` (`atlasLow`) alleen in "laag"; `timerSwap` bij elke staatwissel | per drempel-passage / per pauze |

**Kaart / gebiedslaag — geïmplementeerd (read-only, geen klik-/selectie-interactie, die hoort bij Attack)**

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Gebiedsvulling wisselt (eigenaarswissel) | `TerritoryDto.ownerPlayerId` wijzigt (`TerritoryConquered`) | `TvMainBoardScreen` (`boardTok.ownFill`/`enFill`/`neuFill` uit `atlasTok()`) | geen ownership-washovergang gebouwd in deze taak (`atlasOwnerWash`/`atlasBadgeSwap` horen bij Attack, waar eigenaarswissels daadwerkelijk voorkomen — Reinforce wijzigt nooit `ownerPlayerId`) | n.v.t. in Reinforce; bevinding voor de Attack-taak |
| Legeraantal-cijfer op gebied wijzigt | `TerritoryDto.armyCount` wijzigt (`ArmiesReinforced` e.a.) | `TvMainBoardScreen` (centroid-badge, `prevArmy`-ref per territorium) | `tvAnimations.countTick(dir)` (`atlasCountUp`/`atlasCountDown`) | per bevestigde `PlaceReinforcements`-call |
| Gestippelde rand rond rol-herkomstgebied verschijnt/verdwijnt | eigenaarschap van `role.originTerritory` wijzigt t.o.v. de rolhouder (FO §8.1) | niet geïmplementeerd | geen | per eigenaarswissel van een herkomstgebied |
| Selectie-highlight op geldige bron-gebieden | server-berekende geldige-opties-lijst tijdens gebiedsselectie (FO §2.3) | niet geïmplementeerd — **geen DTO-veld gevonden** dat "highlightbare gebieden" draagt | statische rand-wissel in export (L296-297), geen keyframe | per selectiestap — bevinding, zie §5 |
| Selectie-highlight wisselt van "geldige bron" naar "geldig doelwit" | speler kiest een bron | zelfde gat als hierboven | — | per aanval/verplaatsing |
| Combat-burst-ring op gebied met lopend gevecht | `pendingCombat` niet-null | niet geïmplementeerd | `tvAnimations.burstLong` (`atlasBurst 1.1s`) | per `DeclareAttack`, continu (`infinite`) zolang overlay zichtbaar |

**Combat-overlay (`showCombat`)**

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Overlay verschijnt (kaart dimt, aanvaller/verdediger-paneel) | `pendingCombat` wordt niet-null (`AttackDeclared`) | niet geïmplementeerd | geen geïdentificeerd voor de overlay-container zelf | per `DeclareAttack` |
| Aanvallersdobbelstenen vliegen van links in, 1 per aanvalsdobbelsteen | `DiceRolledMessage` (`context: "attack"`) | niet geïmplementeerd | `tvAnimations.attackerDie(idx)` (`atlasRollL` + `atlasSettle`, gestaggerd) | 1–3 dobbelstenen per `DeclareAttack` |
| Verdedigersdobbelstenen vliegen van rechts in, ná aanvaller | `DiceRolledMessage` (`context: "defense"`) | niet geïmplementeerd | `tvAnimations.defenderDie(idx)` (`atlasRollR` + `atlasSettle`, gestaggerd, ingebouwde offset t.o.v. aanvaller) | 1–2 dobbelstenen per `ChooseDefenseDice` |
| Reroll-chip-teller wijzigt (Reroll-roleffect, FO §8.1/§5.3) | aanvaller herwerpt vóór verdediger gooit | niet geïmplementeerd | — | de Reroll-rol zelf heeft nog geen hub-methode/command-handler (alleen `RerollEffect` als data, `RiskGame.Rules/Roles/RoleDefinition.cs`); `DiceRolledMessage`/`CombatNarratedMessage` dragen inmiddels wel een `CorrelationId` die een herworp aan hetzelfde gevecht zou koppelen zodra Reroll gebouwd wordt, maar het herworp-event zelf en de resterend-aantal-chip hebben nog geen DTO-bron — bevinding |
| Gevechtsresultaat-tekst ("X wint") | `CombatNarratedMessage` (`AttackerLosses`/`DefenderLosses`), gebroadcast naar de hele groep sinds de combat-narratie-taak (`GameHub.ChooseDefenseDice`) | niet geïmplementeerd — er bestaat nog geen consumerend component/hook, zie §5 | geen | per resolutie |
| "VEROVERD"-badge + meeverplaatst-aantal | `Conquered`-vlag op `CombatNarratedMessage` (nu gebroadcast, was voorheen alleen RPC-respons aan de aanvaller) + latere `MoveAfterConquest` (blijft ongenarreerd, zie §5) | niet geïmplementeerd | `tvAnimations.resultPop` (`atlasPop`, vertraagd) | per succesvolle verovering |
| Overlay verdwijnt, kaart-dim verdwijnt | gevecht volledig afgehandeld inclusief bevestigde meeverplaatsing | niet geïmplementeerd | — | per gevecht |

**Actief-effect-strip / event-overlay / attrition-overlay** — de export gebruikt dezelfde
`showEvent`-vlag voor zowel de kleine persistente strip linksboven (L342-351) als de
volledige kaart-modal (L404+); zie vraag in §5 of dit twee losse werkelijke toestanden zijn
die de demo bewust samenvouwt.

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Actief-effect-strip (icoon+titel+duur) | `ActiveEffects[]` niet-leeg (`EffectApplied`/`EffectExpired`) | niet geïmplementeerd — **`ActiveEffects` staat niet in `GameStateDto`** | geen | per `EffectApplied`/`EffectExpired` — bevinding |
| Gebeurteniskaart-modal verschijnt (icoon, titel, omschrijving) | `EventCardDrawn` | niet geïmplementeerd — **geen veld voor "huidige gebeurteniskaart" in `GameStateDto`** | `tvAnimations.cardReveal` (`atlasCard`) | eenmalig per ronde bij `eventsEnabled` (FO §9.2) |
| Sheen-sweep over de kaart | zelfde mount | niet geïmplementeerd | `tvAnimations.cardSheen` (`atlasSheen`, `infinite` zolang kaart zichtbaar) | continu zolang overlay zichtbaar |
| "eventAfter"-onderschrift (samenvatting na-effect) | onduidelijk of dit gelijktijdig met de kaart verschijnt of later | niet geïmplementeerd | — | vraag |
| Attrition-modal verschijnt | `ArmyAttrition`-effect in afhandeling | niet geïmplementeerd — **geen DTO-representatie van "lopende attrition-keuzes"** | `atlasCard` + `atlasSheen` (zelfde als event-kaart) | per `ArmyAttrition`-event |
| Voortgangsbalk vult naarmate spelers kiezen | aantal spelers dat hun legerverwijdering al heeft bevestigd | niet geïmplementeerd | `transitions.progressFillTv` (`width .5s`) — **animeert op `width`**, wat de TV-regel "alleen transform/opacity" in `frontend/CLAUDE.md` schendt | continu terwijl spelers kiezen — bevinding, zie §5 |
| Cijferteller "N / totaal" | zelfde als hierboven | niet geïmplementeerd | geen behalve de balk | per keuze |

**Eliminatie-overlay (`showElim`)**

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Overlay verschijnt full-screen, speler-icoon + kop slaan in | `PlayerDto.isEliminated` kantelt naar `true` (`PlayerEliminated`) | niet geïmplementeerd | `tvAnimations.titleSlamShort`/`titleSlamLong` (`atlasSlam`) | per eliminatie |
| "uitgeschakeld door"-onderschrift | zelfde event, vereist identiteit van de veroorzaker | niet geïmplementeerd | — | `CombatNarratedMessage` draagt dit inmiddels (`AttackerId` + `EliminatedPlayerId`, gebroadcast), maar alleen transiënt op het moment van het gevecht — `PlayerDto` zelf heeft nog steeds geen blijvend "door wie"-veld op de state-snapshot, dus een TV die pas ná de eliminatie `WatchGame`/`RejoinGame` doet, kan dit niet meer achterhalen — bevinding |
| Overlay verdwijnt | onduidelijke duur/dismissal-conditie (auto-timeout? volgende actie?) | niet geïmplementeerd | — | vraag |

**Rechterspelerspaneel (persistent tijdens InProgress)**

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Gebiedsaantal-cijfer (`p.terr`) | aantal `territories` met `ownerPlayerId === player.id` | niet geïmplementeerd | geen | zeer frequent |
| Legertotaal-cijfer (`p.army`) | som van `armyCount` over eigen gebieden | niet geïmplementeerd | geen | zeer frequent |
| Gouden linkerbalk + "AAN ZET"-tag | `turnState.activePlayerId` | niet geïmplementeerd | geen | per beurt |
| Roleffect-chip aan/uit ("boost uit") | speler bezit `role.originTerritory` niet meer | niet geïmplementeerd | geen | per eigenaarswissel van een herkomstgebied |
| Auto-pass-tag verschijnt | host roept `SetAutoPass` aan | niet geïmplementeerd — **geen `isAutoPass`-veld in `PlayerDto`**, wel genoemd in TO §3.1 conceptueel model | geen | bevinding |
| Uitgeschakelde rij dimt + "Uitgeschakeld"-stempel | `PlayerDto.isEliminated` | niet geïmplementeerd | geen (statische overlay) | eenmalig per eliminatie |
| Naam doorgestreept | zelfde als hierboven (redundant met de dim-overlay in export) | niet geïmplementeerd | geen | eenmalig per eliminatie |

**Feed-strip (persistent tijdens InProgress)**

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Nieuw feed-item verschijnt ("X valt Y aan vanuit Z", kaarteninleg, verplaatsing, verovering, …) | elke genarreerde actie | niet geïmplementeerd — **geen enkel DTO-veld voor een feed/log** | geen geïdentificeerd voor het invoegen zelf | zeer frequent, mogelijk meerdere keren per beurt — bevinding |

### Finished (design-state 9 "Winner")

| Change | Trigger | Rendered by | Existing motion | Frequency |
|---|---|---|---|---|
| Winnaar-kop + spelerchip slaat in | `phase` kantelt naar `Finished` (`GameWon`) | niet geïmplementeerd | `tvAnimations.titleSlamLong` (`atlasSlam`) | eenmalig per spel |
| Missie-onthullingskaarten renderen voor alle spelers (naam, missietekst, status) | zelfde `GameWon`-overgang; vereist elke speler se missie, die normaal privacy-gated is (TO §6.1) | niet geïmplementeerd | geen | **geen veld gevonden dat missies bij spelend gaat onthullen** — bevinding |
| Per-speler stemchip vult met vinkje | speler brengt "Opnieuw spelen"-stem uit | niet geïmplementeerd | geen | **geen DTO-veld voor stemstatus gevonden** — bevinding |
| Stem-tekst ("nog X nodig") | zelfde | niet geïmplementeerd | geen | idem |
| Host-only "Nieuw spel instellen"-override | dit is een telefoon-actie van de host (FO §7), geen TV-visual | n.v.t. voor TV | n.v.t. | ter volledigheid genoemd, niet een TV-change |

### Persistente chrome buiten de fase-tabellen

- `TvPageHeader` (merk, kicker-regel, badge) wordt vandaag alleen in de Lobby- en
  OrderRoll-branch gerenderd; de badge-tekst wisselt bij fase-intrede.
- De topbalk in Claim/Board (turn-chip, fase-pillen, timer, L228-248 in de export) is
  **niet dezelfde component** als `TvPageHeader` — het design toont ze als wederzijds
  uitsluitende layouts. Of dat bewust is of een gat tussen Lobby/OrderRoll-ontwerp en
  Board-ontwerp, is een vraag voor wie de Claiming/InProgress-schermen ontwerpt.

---

## 2. Mount behaviour

- `TvPage` retourneert per fase een structureel andere JSX-boom (error-scherm,
  connecting-scherm, OrderRoll-branch, "overige fase"-placeholder-branch, of
  Lobby-branch). Omdat de kind-elementen per branch structureel verschillen, remount
  React de subtree bij elke fase-overgang — bestaande entrance-animaties zouden dus wél
  opnieuw afvuren bij een fase-wissel, alleen zijn er momenteel nauwelijks
  fase-entry-animaties gedefinieerd om te refiren.
- `TvShell` (`<div className="dark h-full">`) is de enige stabiele wrapper: die blijft
  bestaan zolang `TvPage` zelf niet unmount (alleen bij verlies van `gameId`/verbinding).
  Hij heeft nooit een eigen animatie nodig gehad en heeft er ook geen.
- **Lobby:**
  - `LobbyQrPanel` mount eenmalig bij fase-intrede; zijn QR-genererende `useEffect` is
    gekeyed op `joinUrl` (dus op `gameId`), niet op spelerslijst-wijzigingen — hij
    hergenereert dus nooit tijdens de rest van Lobby.
  - `LobbyPlayerList`-spelerskaarten zijn gekeyed op `player.id` (stabiel): een kaart
    mount één keer bij join en remount daarna niet meer voor die speler, ook niet
    wanneer die speler later een kleur of rol kiest. Een eventuele toekomstige
    entrance-animatie op de kaart zou dus **niet** refiren bij `ColorChosen`/rolkeuze,
    alleen bij de initiële join.
  - `LobbySettingsSummary` mount eenmalig; omdat instellingen binnen Lobby niet meer
    wijzigen (zie §1), hoeft hij nooit te reageren op een update.
- **OrderRoll:** `OrderRollTvPanel` mount vers bij fase-intrede. De individuele
  `Dice`-elementen zijn **niet** gekeyed op de worp-versie — een herworp (tie-break)
  update dezelfde React-element-instantie met nieuwe `value`-prop, zonder remount. Omdat
  `atlasTumble` een mount-only `both`-animatie is (start bij het verschijnen van het
  element), **refire't de entrance-animatie niet** bij een herworp. Dit is het
  duidelijkste concrete geval waarin een bestaande entrance-animatie een echte
  toestandswijziging mist.
- `useHeldPhase` vertraagt alleen wanneer de fase-overgang zelf (en dus de bijbehorende
  remount) plaatsvindt — het is geen aparte animatielaag, het schuift de remount-timing
  op.
- **Claiming / InitialPlacement / Finished:** renderen nog steeds identieke placeholder-JSX
  (`{t('lobby:placeholder.tv')}`) — dat blijft ongewijzigd door deze taak.
- **InProgress:** heeft sinds deze taak een eigen component (`TvMainBoardScreen`, geregistreerd
  in `tvScreens.ts`), dus de overgang naar `InProgress` levert nu wél een zichtbare wijziging
  en een remount op (structureel andere JSX-boom dan de placeholder-branch). Alleen "Main
  board" is gebouwd; de sub-toestanden binnen `InProgress` (Region select/Combat/Event/
  Elimination) bestaan nog niet — daarbinnen verandert er dus nog niets zichtbaars totdat de
  Attack-taak die overlays bouwt.

---

## 3. Concurrency

Gebaseerd op FO/TO, niet op speculatie; onbepaalde gevallen zijn als vraag gemarkeerd.

1. **Timer-pauze + combat-overlay zijn gegarandeerd gelijktijdig.** FO §5.4: de timer
   pauzeert exact op "Gooi" (`DeclareAttack`) en hervat pas na volledige
   gevechtsafhandeling inclusief meeverplaatsing — dus de timer-visuele-staat-wissel en
   het openen van de combat-overlay vallen per definitie samen.
2. **Aanvallersdobbelstenen kunnen twee keer updaten vóór de verdediger ooit gooit —
   zodra Reroll bestaat.** FO §5.3 punt 3: een aanvaller met een actieve Reroll-rol mag
   herwerpen vóórdat de verdediger heeft gegooid — dus twee
   `DiceRolledMessage(context:"attack")`-events zouden na elkaar kunnen binnenkomen
   voordat er ook maar één `DiceRolledMessage(context:"defense")` arriveert. Vandaag kan
   dit nog niet gebeuren: `AttackGuards.CanDeclareAttack` staat sowieso geen tweede open
   `PendingCombat` toe, en Reroll heeft geen hub-methode/command-handler (alleen
   `RerollEffect` als rol-data). De combat-narratie-taak heeft hier al op
   geanticipeerd: `PendingCombat`/`AttackDeclared`/`DiceRolledMessage`/
   `CombatNarratedMessage` dragen een `CorrelationId` die precies dit soort
   overlappende rolreeksen aan elkaar zou koppelen zodra Reroll gebouwd wordt.
3. **Timeout-gedreven fasewissel tijdens een open gevecht kan niet.** FO §5.4 zegt
   expliciet dat de timer stilstaat tijdens gevechtsafhandeling — een timeout kan dus
   per definitie niet midden in een combat-overlay vallen. Dit is een uitgesloten
   paar, geen open vraag.
4. **Eliminatie kan overlappen met een nog zichtbare combat-overlay.** FO/TO zeggen
   niet expliciet dat dit kan, maar logisch volgt `PlayerEliminated` op
   `CombatResolved`/`TerritoryConquered` zodra een speler zijn laatste gebied verliest.
   Of de server dit als twee losse `GameStateUpdated`-pushes verstuurt of als één
   gecombineerde push, is niet uit FO/TO af te leiden — **vraag**.
5. **Eén broadcast kan meerdere gebieden tegelijk wijzigen.** Zeker en zelfs de norm:
   `MoveAfterConquest` wijzigt zowel bron- als doelgebied in dezelfde `GameStateDto`;
   `Fortify` idem. TO §10 opt.2 noemt full-state-push als huidige richting, dus elke
   `GameStateUpdated` kan in principe elk veld hertekenen ook al betrof de actie maar
   één ding — de client mag nooit aannemen "één broadcast = één zichtbare wijziging".
6. **`ArmyAttrition` is expliciet gelijktijdig, niet beurt-volgordelijk.** FO §9.2:
   meerdere getroffen spelers kiezen tegelijk, buiten de normale beurtvolgorde om, en
   kunnen in willekeurige volgorde/overlappend reageren terwijl de TV één gedeelde
   wachtstaat toont. Dit is het enige door de FO zelf benoemde voorbeeld van échte
   concurrency (niet sequentieel per beurt).
7. **Event-kaart-reveal + eerste actie van de volgende ronde:** FO §9.2 zegt niet of de
   event-kaart-overlay speleracties blokkeert of ernaast getoond wordt — **vraag**.
8. **`WatchGame`/`RejoinGame`-respons vs. een nieuwere live `GameStateUpdated`:** dit is
   een reële race en al opgelost in code — `useTvGame.applyState` (regel 22-24) negeert
   een respons met een `stateVersion` die niet hoger is dan de al bekende state.
9. **`DiceRolled`/`CombatNarrated` vóór `GameStateUpdated` voor dezelfde actie:**
   `GameHub.cs` stuurt in `RollForOrder`/`DeclareAttack` steeds eerst `DiceRolled` en
   dán (via `UnwrapAndBroadcastAsync`) `GameStateUpdated`; `ChooseDefenseDice` stuurt
   `DiceRolled` → `CombatNarrated` → `GameStateUpdated`, alle drie sequentieel
   `await`-ed naar dezelfde group. Voor één client-verbinding is de aankomstvolgorde
   daarmee betrouwbaar narratie-vóór-state — maar bij een rejoin die tussen deze pushes
   in valt, is aankomstvolgorde geen garantie meer dat een `CombatNarrated` bij de
   *eerstvolgende* snapshot hoort. Daarom draagt `CombatNarratedMessage` een eigen
   `StateVersion` (gelijk aan de `GameStateDto.StateVersion` die het gevecht oplevert),
   zodat een consument dezelfde verdediging kan toepassen die `useTvGame.applyState` al
   op het state-kanaal gebruikt (een niet-hogere versie negeren), in plaats van op
   aankomstvolgorde te vertrouwen. Geen open vraag meer — het wire-contract levert het
   correlatiemiddel, een toekomstige consument moet het alleen nog gebruiken.

---

## 4. Weight-voorstel

**Dit is een voorstel dat een beslissing van jou vereist, geen conclusie.** Per
logische rijgroep uit §1, met één-regel-onderbouwing.

| Rijgroep | Voorstel | Onderbouwing (kort) |
|---|---|---|
| Lobby → OrderRoll → volgende fase | screen-level | volledige contextwissel, geen gedeeld canvas tussen fases |
| Nieuwe spelerskaart in Lobby | in-place | toevoeging aan een lijst, rest van het scherm blijft ongewijzigd |
| Kleur/rol verschijnt op bestaande spelerskaart | in-place | mutatie van één kaart, geen lijstherordening |
| Dobbelstenen-worp (order-roll of combat) | in-place | het element bestaat al (of verschijnt op een vaste positie); alleen de worp zelf is de gebeurtenis |
| Speelvolgorde-ranglijst verschijnt | region-level | nieuw bloc onder de dobbelstenen, geen bestaand element dat muteert |
| Claim: gebiedspolygoon krijgt eigenaar | in-place | één polygoon op de kaart, rest van de kaart ongewijzigd |
| Board: eigenaarswissel van een gebied | in-place | idem, ook al kan het samen met een legertelmutatie optreden |
| Board: legeraantal-mutatie | in-place | los element van eigenaarswissel, zie §1 |
| Selectie-highlight (bron/doelwit) | region-level | raakt een set gebieden tegelijk, niet één enkel element |
| Combat-overlay open/dicht | screen-level (modal) | dimt de hele kaart, vergelijkbaar gewicht als een fase-wissel |
| Event-kaart / attrition-overlay open/dicht | screen-level (modal) | zelfde reden als combat-overlay |
| Eliminatie-overlay | screen-level (modal) | full-screen per design |
| Topbalk: actieve-speler/fase-pil/timer | region-level | horen bij elkaar als één samenhangend blok, niet los van elkaar |
| Rechterspelerspaneel-rij-mutatie (gebieden/legers/effect-chip) | in-place | mutatie van één rij, rest van paneel ongewijzigd |
| Feed-item toevoegen | region-level | nieuw item in een lijst-met-vaste-hoogte, kan bestaande items verschuiven |
| Finished: winnaar-onthulling | screen-level | volledige contextwissel, zoals elke fase-overgang |

---

## 5. Findings

### `useHeldPhase` — 8 seconden hold
- **Wat:** houdt `displayPhase` op `GamePhaseDto.OrderRoll` vast nadat de server al is
  doorgeschoven naar de volgende fase, zodat de bepaalde spelersvolgorde zichtbaar
  blijft in plaats van meteen te verdwijnen.
- **Waar getriggerd:** `useHeldPhase.ts`, gebruikt in `TvPage.tsx:22`
  (`const displayPhase = useHeldPhase(state?.phase)`).
- **Duur:** `ORDER_ROLL_REVEAL_HOLD_MS = 8000` — dit getal heeft **geen bron** in het
  FO, het TO, of de design-export/`motion.ts`. Het is een implementatiekeuze zonder
  ontwerp-onderbouwing.

### Spelregel-vragen die het FO niet beantwoordt
- Blijven `LobbySettingsSummary`-instellingen echt bevroren zolang het spel in Lobby
  zit, of kan de host ze na het aanmaken van de lobby nog wijzigen? FO §10 beschrijft
  alleen het instellen vóór de lobby ontstaat.
- Mag een speler in Lobby van kleur/rol wisselen nadat hij al gekozen heeft, of is een
  keuze definitief? FO §3 zegt "live bijgewerkt zodra iemand anders kiest" maar niet of
  je je eigen keuze kunt herzien.
- `InitialPlacement` heeft geen eigen design-state — hergebruikt het de "Main
  board"-visual (state 3) of heeft het een eigen, nog niet ontworpen scherm?
- Toont de TV tijdens `InitialPlacement` een teller "nog N startlegers te plaatsen" per
  speler? Geen DTO-veld hiervoor gevonden.
- Blokkeert de event-kaart/attrition-overlay speleracties, of loopt het spel er
  gewoon doorheen (FO §9.2 zwijgt hierover)?
- Verschijnt/verdwijnt de eliminatie-overlay op een vaste trigger (bv. na een druk op
  "verder"), of automatisch na verloop van tijd? Niet gespecificeerd.
- Worden bij `Finished` de geheime missies van alle spelers alsnog naar de TV gepusht
  (privacy-grens TO §6.1 opgeheven na afloop), en via welk veld? Geen veld gevonden.
- Wordt de "Opnieuw spelen"-stemstatus per speler ooit naar de TV-groep gepusht? Geen
  veld gevonden.

### Gaten tussen FO/TO en de huidige `GameStateDto`
Deze zijn geen ontwerpvragen maar vastgestelde afwezigheden in de wire-contracten die
nodig zijn om §1 volledig te kunnen implementeren:
- Geen highlightbare-gebieden-veld voor hybride selectie (FO §2.3).
- Geen timer-resterend-tijd-veld op `TurnStateDto` (TO §5.3 noemt het conceptueel,
  de DTO-mapper stuurt het niet mee).
- Geen `ActiveEffects`-veld op `GameStateDto` (wel in het TO §3.1-conceptmodel).
- Geen feed/log-veld — de hele "Gebeurtenissen"-strip (export L390-401) heeft geen
  wire-representatie.
- Geen `isAutoPass`-veld op `PlayerDto` (wel genoemd in TO §3.1).
- Geen blijvend "door wie geëlimineerd"-veld op `PlayerDto` (zie hieronder — inmiddels
  wel transiënt beschikbaar via de narratieve broadcast).
- **[Opgelost sinds de combat-narratie-taak]** `CombatResultResponse` ging alleen als
  RPC-retourwaarde naar de aanroepende speler. `GameHub.ChooseDefenseDice` broadcast nu
  óók `CombatNarratedMessage` naar de hele TV-groep (`AttackerId`, `DefenderId`,
  `From-`/`ToTerritoryId`, verliezen, `Conquered`, `EliminatedPlayerId`, `StateVersion`,
  `CorrelationId`) — de TV hoeft dus niet meer zelf oude/nieuwe state te diffen om af te
  leiden wie won/verloor of een gebied veroverd is. Dit is puur wire-contract: er
  bestaat nog géén frontend-consumptie (geen `HubResponses.ts`-type, geen
  `useTvGame`-uitbreiding, geen component) — bewust uit scope gehouden tot er een
  consumerend scherm is (Combat-overlay staat immers nog op "niet geïmplementeerd" in
  §1). Blijft ongewijzigd: `MoveAfterConquest` levert geen eigen narratief event, en de
  narratie is transiënt — een rejoin ná het gevecht ziet 'm niet meer terug, alleen het
  eindresultaat in de snapshot.
- Geen expliciet wire-signaal voor een Reroll-gebruik los van een gewone
  `DiceRolledMessage`, en dus geen bron voor de "resterend aantal herworpen"-chip uit
  het design — de Reroll-rol zelf heeft nog geen hub-methode. Wel al aangelegd: een
  `CorrelationId` op `PendingCombat`/`DiceRolledMessage`/`CombatNarratedMessage` die een
  toekomstige herworp aan hetzelfde gevecht zou koppelen (zie §3, punt 2).

### Elementen die niet met alleen `transform`/`opacity` kunnen
- `transitions.progressFillTv` (`'width .5s'`), gebruikt op de attrition-voortgangsbalk
  (export L427), animeert op `width`. `frontend/CLAUDE.md` staat op TV alléén
  `transform`/`opacity` toe ("wat layout of paint triggert… stottert daar"). Dit is dus
  een expliciete schending in de export zelf van de eigen TV-motion-regel — melden, niet
  zelf oplossen met een `scaleX`-vervanger of iets dergelijks.
- `atlasFlip` (gedefinieerd in `motion.ts`/het oorspronkelijke design, nergens toegepast)
  gebruikt `filter`, wat sowieso niet mag op TV — al gemarkeerd als ongebruikt in
  `motion.ts` zelf, destijds bevestigd vanuit het oorspronkelijke design: geen enkele
  `animation:`-declaratie daarin refereerde naar `atlasFlip`.

### Overig
- De `showEvent`-vlag in de demo-JS stuurt zowel de kleine persistente
  actief-effect-strip (L342-351) als de volledige event-kaart-modal (L404+) aan. Of dit
  in het echte spel twee onafhankelijke toestanden zijn die de demo bewust
  samenvouwt, of dat ze werkelijk altijd samen op/neer gaan, is niet uit de export af
  te leiden — vraag voor de ontwerper.
