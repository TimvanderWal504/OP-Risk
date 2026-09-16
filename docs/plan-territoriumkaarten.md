<!-- Werkplan, geen changelog: git-commits blijven de enige wijzigingslog (CLAUDE.md). -->
<!-- Oorsprong: planning-sessie 2026-09-16, incl. impeccable shape-brief en twee elite-code-reviews. -->

# Plan: territoriumkaarten werkbaar maken

## Context

De backend kent al vrijwel alle bouwstenen voor territoriumkaarten (FO §4.4, §5.2, §7):
`Card`, `CardDeckBuilder`, `CardSetEvaluator`, `CardTradeCalculator`, `ReinforceGuards.CanTradeInCards`
/`MustTradeInCards`, events `CardsTraded`/`CardDrawn` met vouwregels, hand-overdracht bij
eliminatie, `GameHub.TradeInCards`, `PlayerDto.Hand` inclusief privacy-grens. Toch is de feature
onbruikbaar, omdat de keten nergens gesloten is:

1. **De trekstapel wordt nooit gevuld of geschud** — `DeckState.DrawPile` blijft `[]`
   ([GameProjection.cs:59](src/RiskGame.Persistence/Projections/GameProjection.cs#L59)).
2. **Kaart trekken na een beurt met verovering is niet gebouwd**; `TurnState` weet niet of er
   deze beurt veroverd is ([TurnFlowCommandHandler.cs:19-21](src/RiskGame.Api/Commands/TurnFlowCommandHandler.cs#L19-L21)).
3. **Verplichte inleg bij 5+ wordt niet afgedwongen** — `MustTradeInCards` wordt nergens aangeroepen.
4. **Inleg bij ≥6 na eliminatie (FO §7)** botst met de guard die inleg tot Versterken beperkt.
5. **Frontend**: `hand` is bewust uit `PlayerDto` (TS) gelaten, geen `tradeInCards` in de
   hub-provider, geen hand-/inleg-scherm, geen kaart-component in `DESIGN.md`.

Doel: een speler trekt na een veroverende beurt een kaart, ziet zijn hand op de telefoon, legt
een geldige set in voor legers (incl. +2-bezitsbonus) en wordt gedwongen in te leggen bij 5+
(en bij ≥6 na een eliminatie).

## Genomen beslissingen (door de gebruiker, 2026-09-16)

| Onderwerp | Besluit |
| --- | --- |
| Scope | Territoriumkaarten (niet kaartvarianten/maps) |
| Lege trekstapel | Aflegstapel opnieuw schudden (klassiek) |
| ≥6 kaarten na eliminatie | Direct inleggen in de Aanvallen-fase; legers meteen plaatsen; daarna gaat Aanvallen verder |
| Design hand/inleg-UI | Gebruiker levert een design aan; wordt in het glass-panel-systeem uitgewerkt via `/impeccable` en vastgelegd in `DESIGN.md` |
| Weergavethema | Nu vast `classic`; wordt later een lobby-instelling — structuur daarop voorbereiden, wire-contract nog niet (CLAUDE.md: interne structuur mag vooruitlopen, DTO niet) |
| Timer verloopt in Versterken met 5+ | Geen auto-inleg; verplichting schuift door naar de volgende beurt |
| Moment ≥6-inleg in Aanvallen | Ná de bevestigde meeverplaatsing; timer loopt door; `DeclareAttack`/`EndPhase` geblokkeerd zolang open |
| Hand-aantal | Publiek (`handCount` in `PlayerDto`); inhoud blijft privé. Eigen aantal ook in de "Mijn kaarten"-headerknop |
| Timeout met niet-geplaatste inleg-opbrengst | Niet-geplaatste legers vervallen, **maar een inleg waarvan de opbrengst niet geplaatst is wordt teruggedraaid**: kaarten terug in de hand, inlegwaarde terug, bezitsbonus van het gebied af. Toerekening: onbenutte rest eerst aan de laatste inleg (zie taak 4b) |
| DB-wipe bij uitrol taak 1 | Akkoord (TO §5-beleid) |

## FO-aanvullingen (bevestigd 2026-09-16, als `docs:`-commit vóór taak 1)

In `docs/functioneel-ontwerp-risk.md`:
- **§5.4**: niet-geplaatste legers vervallen wanneer de timer de beurt naar Verplaatsen dwingt
  (bestaand gedrag, nu expliciet). Uitzondering: een kaarteninleg van deze beurt waarvan de
  setwaarde volledig binnen de onbenutte rest valt, wordt teruggedraaid — de kaarten gaan terug
  naar de hand (en tellen volgende beurt weer mee voor de 5+-verplichting), de inlegwaarde
  wordt hersteld en de bezitsbonus gaat van het gebied af. Toerekening: onbenutte legers worden
  eerst aan de laatste inleg toegerekend, dan aan de voorlaatste, enz.; de basispool vervalt
  als laatste.
- **§5.2**: meerdere inlegs in één Versterken-fase zijn toegestaan; geen maximum.
- **§4.4**: lege trekstapel → aflegstapel wordt geschud tot nieuwe trekstapel; weergavethema
  standaard `classic`, **gepland als lobby-instelling** (rij toevoegen in §10 met status
  "nog niet geïmplementeerd").
- **§5.2**: bij het verlopen van de beurttimer tijdens Versterken vervalt de inlegverplichting
  voor die beurt niet maar schuift door; er wordt niet automatisch ingelegd.
- **§7**: de ≥6-inleg gebeurt in de Aanvallen-fase, ná de bevestigde meeverplaatsing; de
  verkregen legers worden direct geplaatst; aanvallen/fase beëindigen kan pas daarna.
  Hand-aantal van elke speler is publiek (TV en medespelers), de kaarten zelf niet.

## Aanpak: acht kleine taken (één per sessie, conform CLAUDE.md)

Bouwvolgorde volgt TO §11: Rules → Persistence → Api → frontend. Elke taak eindigt met
`dotnet build` + `dotnet test` (door jou gedraaid) groen; frontend-taken ook `pnpm run build`
+ `pnpm test` + design-conformiteitscheck (frontend/CLAUDE.md — nog te lezen bij taak 5).

### Taak 0 — Bugfix: dubbele kaart-id's in `TradeInCards` (backend, klein)

Bevinding uit de plan-review (Critical): `ReinforceGuards.CanTradeInCards` zoekt elk id los op
in de hand en controleert niet op dubbelen. `["card-x","card-x","card-x"]` is daardoor een
geldige three-of-a-kind met één kaart, levert 3× de bezitsbonus op, en de projectie legt
drie kopieën op de aflegstapel — na taak 1 (hertschudden) groeit het deck dan met duplicaten.
- `CanTradeInCards`: faal met `reinforce.duplicateCardIds` als `cardIds.Distinct().Count() != cardIds.Count`.
- Test in `ReinforceGuardsTests` + locale-sleutel in `errors.ts`.
- Moet vóór taak 1 landen, omdat taak 1 de schade verergert.

### Taak 1 — Deck schudden bij spelstart én bij lege trekstapel (backend)

- **Rules**: `RiskGame.Rules/Map/CardDeckShuffler.cs` (static, naam parallel aan
  `CardDeckBuilder`): Fisher-Yates over `IReadOnlyList<Card>` met `IRandomSource.Next`, geeft
  de kaart-id-volgorde terug.
  Deterministisch met vaste seed (bestaand testpatroon: vaste-seed `IRandomSource` in
  `Rules.Tests`).
- **Persistence**: nieuw event `DeckShuffled(GameId, IReadOnlyList<string> CardIds)`.
  Vouwregel: `DrawPile` = de kaarten uit `state.Map.Deck` **die in `CardIds` staan, in die
  volgorde** (bij een hertschudding zijn dat alleen de aflegstapel-kaarten; kaarten in handen
  blijven waar ze zijn), `DiscardPile = []`. De projectie vouwt alleen; welke ids erin horen
  (volledig deck bij start, aflegstapel bij hertschudden) bepaalt de command handler.
  Bewust één event voor beide gevallen (start én hertschudden van de aflegstapel): het feit
  is hetzelfde ("dit is nu de trekstapel"), en het event draagt zijn eigen uitkomst (TO §5.4).
- **Api**: `LobbyCommandHandler.StartGameAsync` appendt `DeckShuffled` vlak vóór `GameStarted`
  (`random` is daar al geïnjecteerd, [LobbyCommandHandler.cs:190](src/RiskGame.Api/Commands/LobbyCommandHandler.cs#L190)).
- **Uitrol**: bestaande streams hebben geen `DeckShuffled` en dus een lege trekstapel. TO §5
  ("pre-release, database wordt leeggegooid, geen upcast-pad") geldt ook hier — expliciet in de
  commit-body melden, zodat het geen stille no-op wordt (zie ook de invariant in taak 2).
- **Tests**: `CardDeckShufflerTests` (permutatie, determinisme, geen dubbelen), projectietest
  in `Persistence.Tests` (DrawPile gevuld, 45 kaarten voor standaard-43; hertschudden met
  kaarten in handen laat die handen ongemoeid), Api-test dat spelstart een gevulde trekstapel
  oplevert.

### Taak 2 — Kaart trekken na een beurt met verovering (backend)

- **Rules**: `TurnState` krijgt `bool HasConqueredThisTurn`. Let op de bestaande valkuil:
  `PhaseChanged` bouwt altijd een nieuwe `TurnState` ([GameProjection.cs:166-169](src/RiskGame.Persistence/Projections/GameProjection.cs#L166-L169)),
  dus de vlag moet bij een fase-overgang **binnen dezelfde beurt** worden meegenomen. Regel:
  `HasConqueredThisTurn = @event.TurnPhase == Reinforce ? false : state.TurnState?.HasConqueredThisTurn ?? false`
  — een beurt begint altijd in Versterken, intra-beurt-overgangen gaan altijd naar Aanvallen of
  Verplaatsen. Niet op `ActivePlayerId` vergelijken: dat is een indirecte afleiding van
  hetzelfde feit en breekt zodra een speler ooit twee beurten achter elkaar zou krijgen.
- **Persistence**: `TerritoryConquered`-vouwregel zet `HasConqueredThisTurn = true`.
- **Api**: `TurnFlowCommandHandler` krijgt `IRandomSource` (zoals `AttackCommandHandler`).
  In `EndTurnAsync`, vóór `TurnEnded`: als `HasConqueredThisTurn` → is de trekstapel leeg en
  de aflegstapel niet, eerst `DeckShuffled` (taak 1); daarna `CardDrawn` met de **bovenste**
  kaart van de trekstapel (`DrawPile[0]`). De stapel is al geschud; nogmaals willekeurig
  kiezen voegt geen toeval toe maar wel een tweede plek waar `IRandomSource` het replay-pad
  bepaalt. `IRandomSource` is in deze handler dus alleen nodig voor het hertschudden. Zijn beide stapels leeg, dan is dat alleen legitiem als álle kaarten
  in handen zijn (`Map.Deck.Count == Σ hand.Count`): dan geen kaart. Anders is het een bug
  (bv. een stream zonder `DeckShuffled`) → `InvalidOperationException`, geen stille no-op
  (src/CLAUDE.md: exceptions voor onmogelijke toestanden, niet voor "mag niet").
  Nb.: na een hertschudding is de bovenste kaart `shuffledIds[0]`, niet `state.Deck.DrawPile[0]`
  (die is leeg) — de handler werkt met de lokaal berekende volgorde.
- **Tests**: `GameHubTurnFlowTests`: beurt met verovering → hand +1, trekstapel −1; beurt
  zonder verovering → niets; lege trekstapel → hertschudden + trekken; vlag overleeft
  Aanvallen→Verplaatsen; vlag reset bij nieuwe beurt.

### Taak 3 — Verplichte inleg bij 5+ afdwingen (backend + wire-contract)

- **Rules**: `ReinforceGuards.CanPlaceArmies` en `TurnGuards.CanEndPhase` (tak Reinforce)
  falen met `reinforce.mustTradeInCardsFirst` zolang `MustTradeInCards` waar is.
  `ForceAdvanceToFortifyAsync` (timer) blijft onaangetast (aanname 3).
- **Api/DTO**: `TurnStateDto.MustTradeInCards` (bool) — de telefoon mag geen spelregel
  client-side nabouwen (frontend/CLAUDE.md), dus de server levert de vlag. Betekenis:
  "de actieve speler moet inleggen vóór elke andere actie". **Fase-bewust vanaf dag één**:
  in Versterken `MustTradeInCards` (≥5), in elke andere fase `false` — taak 4 breidt de
  Aanvallen-tak uit met de ≥6-regel. Zonder die fase-check zou de vlag in Aanvallen al bij 5
  kaarten aanslaan en de telefoon (taak 6) daar ten onrechte de inleg-stap tonen.
- **Locale-sleutel** `reinforce.mustTradeInCardsFirst` in `frontend/src/locales/errors.ts`
  (bestaand patroon: foutcodes van de server → vertaling).
- Meerdere inlegs per Versterken-fase blijven toegestaan (klassiek; FO stelt geen maximum —
  als FO-notitie opnemen in de docs-commit).
- **Deadlock-bewaking (data-driven)**: met 5 kaarten over 3 symbolen bestaat er altijd een
  geldige set zolang `validSets` zowel `three-of-a-kind` als `one-of-each` bevat
  (duivenhokprincipe: 2+2+1 → één van elk). Een kaartvariant die `one-of-each` schrapt kan een
  speler met 2+2+1 wél vastzetten achter de verplichting. `MapDefinitionParser` valideert
  daarom: beide set-typen aanwezig, anders faalt het laden (zelfde klasse als de
  rollen-/missie-validatie bij spelstart, FO §8).
- **Tests**: `ReinforceGuardsTests`/`TurnGuards`-tests voor de blokkade; `GameHubReinforceTests`
  voor de DTO-vlag en dat inleggen de blokkade opheft (4 kaarten na inleg).

### Taak 4 — Inleg bij ≥6 na eliminatie, direct in Aanvallen (backend + wire-contract)

Grootste backend-taak; eerst een eigen mini-plan voorleggen.

- **Rules**: `ReinforceGuards.MustTradeInCardsDuringAttack(state, playerId)`: fase Attack,
  `PendingCombat == null`, hand ≥ 6 (`cards.json`-onafhankelijke drempel uit FO §7 als
  benoemde constante). `CanTradeInCards` accepteert Attack onder die conditie.
  `CanPlaceArmies` accepteert Attack zolang `ArmiesRemaining > 0`. `AttackGuards.CanDeclareAttack`
  en `TurnGuards.CanEndPhase` (Attack) falen zolang de verplichting open staat óf
  `ArmiesRemaining > 0` in Attack (eerst plaatsen, dan verder vechten).
- **Persistence**: `CardsTraded` vouwt nu al `ArmiesRemaining += SetValue` en de bezitsbonus
  op de gebieden — werkt ongewijzigd in Attack. `ArmiesReinforced` idem.
- **DTO**: hergebruik `TurnStateDto.MustTradeInCards` en `ArmiesRemaining`; geen nieuw veld.
- **Timer**: verloopt de Versterken/Aanvallen-timer terwijl de pool uit een ≥6-inleg nog niet
  geplaatst is, dan geldt de terugdraai-regel uit taak 4b (die taak dekt Versterken én Aanvallen).
- **Tests**: eliminatie met 3+3 kaarten → vlag, `DeclareAttack` geblokkeerd, inleg → pool,
  plaatsen → pool 0 → aanvallen weer toegestaan; meerdere sets nodig (≥9) → vlag blijft.

### Taak 4b — Inleg terugdraaien bij timeout met niet-geplaatste opbrengst (backend)

Besluit gebruiker: kaarten mogen niet "verdampen" door een timeout. Geldt voor Versterken
(vanaf taak 3) en Aanvallen (vanaf taak 4); daarom een eigen taak ná 4.

- **Rules**: `TurnState.UnsettledTrades: IReadOnlyList<UnsettledTrade>` —
  `UnsettledTrade(CardIds, SetValue, OwnedTerritoryBonuses, PreviousTradeValue)`. Gevuld door
  de `CardsTraded`-vouwregel (append), geleegd bij elke `PhaseChanged` (nieuwe `TurnState`;
  `EndPhase` uit Versterken vereist al `ArmiesRemaining == 0`, dus alles is dan geplaatst).
  Nieuwe pure functie `CardTradeReversal.Resolve(turnState) → IReadOnlyList<UnsettledTrade>`:
  loop van laatste naar eerste inleg; zolang `remaining >= trade.SetValue` → terugdraaien en
  `remaining -= trade.SetValue`; anders stoppen. Wat overblijft van `remaining` vervalt.
- **Persistence**: nieuw event `CardTradeReverted(GameId, PlayerId, CardIds, SetValue,
  OwnedTerritoryBonuses, RestoredTradeValue)` — draagt zijn eigen uitkomst, projectie vouwt
  alleen: kaarten van aflegstapel terug naar hand, `NextTradeValue = RestoredTradeValue`,
  bonus-legers van de gebieden af, `ArmiesRemaining -= SetValue`. Veilig omdat tussen inleg en
  timeout geen aanval kan plaatsvinden (Versterken kent geen gevechten; in Aanvallen blokkeert
  taak 4 `DeclareAttack` zolang de pool open staat) en de aflegstapel binnen een beurt nooit
  hertschud wordt (dat gebeurt alleen bij `EndTurn`) — de kaarten liggen er dus nog.
- **Api**: `ForceAdvanceToFortifyAsync` appendt vóór `PhaseChanged` één `CardTradeReverted`
  per teruggedraaide inleg (laatste eerst). `CardsTraded` hoeft `PreviousTradeValue` niet te
  dragen: `UnsettledTrade` haalt het uit `state.Deck.NextTradeValue` op het moment van vouwen.
- **Invariant in de vouwregel**: de bonus-aftrek mag een gebied nooit onder 1 leger brengen.
  De veiligheidsredenering hierboven ("geen gevecht/verplaatsing tussen inleg en timeout")
  is een eigenschap van de guards van vandaag, geen wet — een toekomstig roleffect of
  gebeurtenis dat legers verplaatst binnen Versterken/Aanvallen zou 'm stil breken. Daarom
  gooit de projectie een `InvalidOperationException` als `ArmyCount - bonus < 1` (onmogelijke
  toestand, geen regeluitkomst), zodat zo'n toekomstige wijziging hard faalt in tests.
- **DTO**: `ReinforcementBreakdownDto` krijgt `CardTradeBonus` (som van `SetValue` over
  `UnsettledTrades`, dus alleen van déze fase). Wire-contract-uitbreiding hoort hier en niet in
  taak 5: de state die 'm draagt ontstaat in deze taak, en zonder dit veld heeft de
  "Kaarteninleg"-rij van taak 5 geen databron (de client mag 'm niet zelf bijhouden).
- **Randgeval**: de speler had ≥5 door de teruggedraaide kaarten → volgende beurt geldt de
  verplichting opnieuw (besluit 3), precies de bedoeling van de gebruiker.
- **Tests**: pool 5 + inleg 4, 3 geplaatst → inleg terug, 2 vervallen; 7 geplaatst → inleg
  staat, 2 vervallen; twee inlegs (4, dan 6): rest 5 → niets terug (6 > 5), 5 vervallen;
  rest 7 → alleen de 6 terug, 1 vervalt; rest 10 → beide terug; bezitsbonus na terugdraai van
  het gebied af; hand bevat de kaarten weer; `NextTradeValue` hersteld (twee inlegs: 8 → 6 → 4);
  `CardTradeBonus` in de DTO daalt mee; projectie-invariant gooit bij `ArmyCount - bonus < 1`.
- **FO**: zit al in de §5.4-aanvulling van de docs-commit; hier niets extra.

### Taak 5 — Telefoon: hand tonen en inleggen in Versterken (frontend)

Vereist het aangeleverde design (punt 1) en het lezen van `frontend/CLAUDE.md`.

- `frontend/src/types/Player.ts`: `hand: CardDto[]` toevoegen (spiegelt `PlayerDto`;
  `CardDto` = `{ id, territoryId, symbol }`), `TurnState`-type: `mustTradeInCards`.
- `useGameState.tsx`: `tradeInCards(cardIds)` naast `placeReinforcements`
  ([useGameState.tsx:271](frontend/src/hooks/useGameState.tsx#L271)), invoke `TradeInCards`.
- Nieuw component(en) volgens design, bv. `TerritoryCard` (symbool-glyph + gebiedsnaam via
  `territoryCatalog`, joker-variant) en `TradeCardsStep` (kies 3, `SelectableOption`-patroon,
  bevestigknop; bij `mustTradeInCards` geen "overslaan"). Symbool-label via
  `tDynamic('classic.<symbol>', 'cards')` (bestaand `locales/cards.ts`).
- `PhoneReinforceScreen.tsx`: bij `mustTradeInCards` eerst de inleg-stap, daarna
  `PlaceReinforcementStep`. **Vrijwillige inleg**: `PlaceReinforcementStep` beëindigt de fase
  automatisch zodra `armiesLeft === 0` ([PlaceReinforcementStep.tsx:71-84](frontend/src/components/PlaceReinforcementStep.tsx#L71-L84)),
  dus "na het plaatsen nog even inleggen" bestaat niet. De knop "Leg kaarten in" hoort daarom
  ín `PlaceReinforcementStep` (boven de verdeellijst, alleen zichtbaar bij `hand.length ≥ 3`
  — UI-conditie, geen regel) en opent de inleg-stap zolang er nog legers te verdelen zijn.
  Dit sluit aan bij FO §5.2 ("inleg aan het begin van de versterkingsfase"). De
  "Kaarteninleg"-rij in de opbouw-uitsplitsing (`locales/reinforce.ts` benoemt hem al als
  ontbrekend) toont `reinforcementBreakdown.cardTradeBonus` (taak 4b); alleen zichtbaar bij > 0.
- Geldigheid van een set wordt **niet** client-side gecontroleerd (geen spelregels in de
  client): de server antwoordt met `reinforce.invalidCardSet` en de bestaande foutweergave
  toont dat. Wel mag de knop pas actief zijn bij precies 3 geselecteerde kaarten (UI-conditie,
  geen regel).
- **Thema-voorbereiding**: één resolver `resolveCardTheme(state): CardThemeId` in
  `frontend/src/config/` die vandaag `'classic'` teruggeeft; alle symboollabels en
  icoon-mapping lopen daarlangs. Wordt de lobby-instelling gebouwd, dan raakt alleen die
  resolver (leest dan `state.settings.cardTheme`). Backend: nog géén `GameSettings.CardTheme`
  (wire-contract loopt niet vooruit).
- **Headerknop**: "Mijn kaarten" toont het eigen aantal (`me.hand.length`, geen extra DTO-veld
  nodig voor de eigen speler) — zie design-brief, "Header-actie".
- `DESIGN.md` + `.impeccable/design.json` regenereren via `/impeccable document`.
- Tests: componenttests (vitest) + `PhoneReinforceScreen.test.tsx`.

### Taak 6 — Telefoon in Aanvallen (≥6-inleg) en TV-zichtbaarheid (frontend + wire-contract)

- `PhoneAttackScreen.tsx`: wanneer `mustTradeInCards` → `TradeCardsStep`; wanneer
  `armiesRemaining > 0` in Attack → `PlaceReinforcementStep`. **Let op:** die component
  vuurt vandaag zelf `onEndPhase` zodra `armiesLeft === 0` — in Aanvallen zou dat de
  aanvalsfase beëindigen. Hergebruik vereist dus een expliciete prop (`onAllPlaced` i.p.v. de
  ingebakken `onEndPhase`), zodat de aanroeper bepaalt wat er na het plaatsen gebeurt: in
  Versterken fase-einde, in Aanvallen terug naar de aanval-flow.
- **TV**: `PlayerDto.handCount` (publiek, aanname 5) zodat de TV bij elke speler het aantal
  kaarten toont en een inleg zichtbaar wordt (aantal daalt, pool stijgt). Een theatrale
  "kaarteninleg"-animatie (FO §2, regel 26) is een aparte design-vraag en valt buiten dit plan,
  tenzij het aangeleverde design hem bevat.

## Design-brief: territoriumkaarten op de telefoon (impeccable `shape`, 2026-09-16)

Bron: het oude flat-dark "Mijn kaarten"-design (screenshot van de gebruiker), genormaliseerd
naar `DESIGN.md`. Modus: **Operate** — de speler wil in één blik weten wat hij heeft en of hij
kan/moet inleggen. Geen expressie, wel precisie.

### Job en publiek
Een speler die tussen acties door zijn hand wil zien (vrijwillig, via de header) of die in
Versterken moet/wil inleggen (verplicht bij 5+, of bij ≥6 midden in Aanvallen). Telefoon in de
hand, TV op de achtergrond, weinig aandacht per blik.

### Uitkomst
1. Hand-overzicht: welke kaarten, welk symbool, welke van mijn eigen gebieden (bezitsbonus).
2. Inleg-stap: kies precies drie, bevestig; bij verplichting geen ontsnapping.

### Gekozen richting (besluiten gebruiker)
- **Paneel**: full-screen `ModalShell` op `z-50`, identiek aan `MissionPanel` — slot-regel
  "Alleen zichtbaar voor jou." bovenaan, titel, uitlegregel, raster, secundaire `Button`
  "Sluiten" onderaan. **Geen** bottom sheet, **geen** X-knop (patroon bestaat niet in het systeem).
- **Symbolen**: militaire silhouetten als lijnstijl-SVG in `icons.tsx` (`viewBox 0 0 16 16`,
  `stroke=currentColor`, `strokeWidth 1.5`, `aria-hidden`): infanterie (soldaat), cavalerie
  (ruiter/paard), artillerie (kanon), joker (ster of wildcard-teken — geen unicode). Mapping
  symbool-id → icoon in één plek; themalabel via `tDynamic('classic.<symbol>', 'cards')`.
  De iconen zijn het niet-tekstuele onderscheid tussen kaarttypes (zelfde rol als de
  seat-symbolen bij kleuren), dus verplicht naast het label, nooit i.p.v. het label.
- **Eén tegel, twee gebruiken**: `TerritoryCardTile` (presentational) — passief in het
  hand-overzicht, als `children` van `SelectableOption` in de inleg-stap.

### De tegel
- Surface: `GlassPanel elevation="raised" context="phone"`; binnen de `ModalShell` rendert die
  flat via de no-nested-blur-regel — dat is het gedefinieerde pad (`MissionPanel` doet het ook).
  Geen eigen tint, geen eigen rand buiten de glass-hairline.
- Inhoud, van boven naar beneden: rij [icoon links · symboollabel rechts, Label-stijl:
  uppercase, extrabold, `tracking-[.12em]`, `text-fg-muted` zoals `MissionPanel`'s eyebrow];
  gebiedsnaam (`font-display`, H3 17px/600, `text-fg`) uit `territoryCatalog` via de bestaande
  vertaling; joker: gebiedsregel toont het joker-label, geen gebiedsnaam.
- **"Gebied in bezit"**: alleen als `territoryId` een gebied van de speler is. Signaal =
  randkleur `--pitch-700` (zelfde accent als `StatHeaderCard accentColor="pitch"`) + één
  tekstregel "Gebied in bezit" in `text-fg-secondary`. Geen bolletje, geen tweede kleur, geen
  "+2" (het bonusbedrag zit niet op de draad en hoort niet client-side).
- Raster: 2 kolommen, `gap-3`, scrollbaar binnen het paneel (hand kan na eliminatie 9+ zijn).
  Bij een oneven aantal blijft de laatste tegel links, halve breedte (zoals het oude design).

### Staten en ranges
- **0 kaarten** (de normale start): geen leeg raster maar één regel in het paneel:
  "Nog geen kaarten. Verover in een beurt minstens één gebied en je trekt er een."
- 1–4: raster. 5+: raster + de uitlegregel wordt de waarschuwing (zie copy). 9+: scroll.
- Inleg-stap: 0–2 geselecteerd → bevestigknop disabled (UI-conditie, geen regel); 3 → enabled.
  Server wijst een ongeldige set af (`reinforce.invalidCardSet`) via de bestaande foutweergave;
  de client controleert geen set-geldigheid.
- Verplichte inleg (`turnState.mustTradeInCards`): geen "Overslaan"/"Sluiten"; de stap is de
  enige weg. Vrijwillige inleg in Versterken: secundaire knop "Niet inleggen" terug naar het
  plaatsen.
- Na inleg: terug naar `PlaceReinforcementStep`; de opbouw-uitsplitsing krijgt de rij
  "Kaarteninleg" (`locales/reinforce.ts` benoemt hem al als ontbrekend).

### Header-actie
- `PhonePlayerHeader`: "Mijn kaarten" krijgt `onClick` → paneel; `active` zolang het paneel
  open is (bestaande active-stijl, silver — geen goud).
- Aantal kaarten in de actie-knop: **besloten, meenemen in de eerste bouw.** Vorm: het
  label blijft "Mijn kaarten"; het aantal komt als tabular-numeral badge in de hoek van het
  icoon (zelfde rol als een notificatie-teller), alleen zichtbaar bij ≥1 kaart — bij 0 is er
  niets te melden (Invisible Design Rule). Bij `mustTradeInCards` kleurt de badge
  `--warning` (Caution Amber, functionele status — de ene toegestane amber-toepassing);
  daarbuiten silver-outline. Geen tekst-suffix "· 3": een teller in een label leest als
  onderdeel van de naam.

### Copy (nl / en, nieuw `locales/cardsPanel.ts`, chrome — niet in `cards.ts`)
- title: "Mijn kaarten" / "My cards"
- visibleOnlyToYou: hergebruik `missionPanel.visibleOnlyToYou`? Nee — eigen sleutel, zelfde tekst
  (namespaces blijven per paneel, zoals `missionPanel.ts`).
- intro: "Territoriumkaarten. Bij 5 of meer moet je inleggen voordat je verder speelt." /
  "Territory cards. With 5 or more you must trade in before you continue." (dekt ook de
  ≥6-na-eliminatie-situatie midden in Aanvallen; "aan het begin van je beurt" zou daar liegen)
- empty: zie boven.
- ownedTerritory: "Gebied in bezit" / "Territory owned"
- tradeTitle: "Leg 3 kaarten in" / "Trade in 3 cards"; tradeMandatory: "Je hebt 5 of meer
  kaarten — inleggen is verplicht." ; tradeConfirm: "Inleggen" / "Trade in";
  tradeSkip: "Niet inleggen" / "Don't trade"; close: "Sluiten" / "Close".

### Anti-doelen
- Geen animatie op de tegels (motion draagt hier geen staat; TV-hardware-regel geldt niet op
  de telefoon, maar de Invisible Design Rule wel).
- Geen kaart-"flip", geen kaartrug-artwork, geen thema-switch in de UI.
- Geen wijziging aan `design-tokens.ts`/`motion.ts`.

### Afronding
Na de bouw: `node <impeccable>/scripts/detect.mjs --json <gewijzigde bestanden>` één keer
draaien, design-conformiteitscheck per frontend/CLAUDE.md invullen, daarna
`/impeccable document` zodat `DESIGN.md` de tegel + de vier iconen opneemt.

## Bewust buiten scope

- Lobby-instelling voor het weergavethema (gepland, eigen taak: `GameSettings.CardTheme` + DTO + lobby-UI; frontend-resolver uit taak 5 is dan het enige raakpunt aan de kaartkant).
- `CardTradeBonus`-roleffect: bestaat al in `CardTradeCalculator`; wordt door dit plan
  vanzelf actief, geen extra werk.
- Kaartvarianten/maps.

## Verificatie (door jou te draaien, per taak)

```powershell
dotnet build RiskGame.sln
dotnet test RiskGame.sln
# frontend-taken:
pnpm --dir frontend run build
pnpm --dir frontend test
```

End-to-end na taak 5 (met `/run` of handmatig): spel starten → aanvallen en veroveren →
beurt beëindigen → hand toont 1 kaart op de telefoon, TV toont niets van de inhoud →
herhalen tot 3 passende kaarten → inleggen → pool +4 (zonder `CardTradeBonus`-rol; +2 op eigen
gebied indien van toepassing) → volgende inleg toont 6.
