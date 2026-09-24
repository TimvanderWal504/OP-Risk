namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van de lobby-relevante velden van <see cref="RiskGame.Rules.State.GameState"/>.
/// Groeit in latere plakken mee met wat de volgende fases nodig hebben.
/// </summary>
/// <param name="Winners">
/// Wie het spel gewonnen heeft (<see cref="RiskGame.Rules.State.GameState.Winners"/>) — leeg
/// totdat <see cref="GamePhaseDto.Finished"/> bereikt is. Kan meer dan één speler bevatten
/// (FO §6.1: meerdere spelers kunnen tegelijk aan een winconditie voldoen).
/// </param>
/// <param name="PendingWinnerPlayerId">
/// FO §6.2: alleen gevuld tijdens een lopend laatste-kans-venster ÉN alleen wanneer
/// <see cref="GameSettingsDto.MissionWinTiming"/> op <see cref="MissionWinTimingDto.FullRoundRevealed"/>
/// staat — anders altijd <c>null</c>, ook als er intern wel een <c>PendingWin</c> loopt (optie
/// "Begin van je volgende beurt" onthult bewust niets). Bevat uitsluitend de speler-id, nooit de
/// missie-inhoud: die blijft geheim tot <see cref="GamePhaseDto.Finished"/> (privacy-afdwinging
/// op de enige daarvoor bedoelde plek, <see cref="GameStateDtoMapper"/>, src/CLAUDE.md).
/// </param>
/// <param name="TvDisplay">
/// De TV-weergave van dit spel (plan-testronde-tv punt 2) — openbaar, gaat naar iedereen; de TV
/// past 'm toe, de host-telefoon toont 'm in het "TV-weergave"-paneel.
/// </param>
/// <param name="TvDisplayDefault">
/// <see cref="RiskGame.Rules.State.TvDisplaySettings.Default"/>, zodat de knop "Standaard" op de
/// host-telefoon de server-default verstuurt i.p.v. een eigen kopie ervan bij te houden.
/// </param>
/// <param name="Continents">Continenten met bonus en eventuele eigenaar, voor spelinfo (plan-testronde-tv punt 3).</param>
/// <param name="Events">De gebeurteniskaarten van deze kaartvariant, voor spelinfo (plan-testronde-tv punt 3).</param>
/// <param name="NextCardTradeValue">
/// Hoeveel legers de volgende kaarteninleg oplevert (<see cref="RiskGame.Rules.State.DeckState.NextTradeValue"/>) —
/// het voorbeeld bij de inlegregel in spelinfo, zodat de reeks uit <c>cards.json</c> nergens in tekst
/// herhaald hoeft te worden.
/// </param>
/// <param name="StartingArmies">
/// Startlegers per speler in dit spel (<see cref="RiskGame.Rules.TurnFlow.StartingArmiesResolver"/>) —
/// <c>null</c> in de lobby, waar het spelersaantal nog niet vaststaat.
/// </param>
public sealed record GameStateDto(
    string GameId,
    GamePhaseDto Phase,
    IReadOnlyList<PlayerDto> Players,
    IReadOnlyList<string> AvailableColorIds,
    IReadOnlyList<string> TurnOrder,
    IReadOnlyList<TerritoryDto> Territories,
    TurnStateDto? TurnState,
    IReadOnlyList<PlayerColorDto> Colors,
    IReadOnlyList<RoleSummaryDto> Roles,
    GameSettingsDto Settings,
    // Geen `= []`: een collection-expression is geen compile-time constant, dus dat is geen
    // geldige parameter-default (CS1736). Verplicht maken i.p.v. een nullable-omweg (zoals
    // GameState.cs's `winners ?? []` in een gewone class-constructor) dwingt bovendien elke
    // toekomstige aanroeper van deze ene, hier al bekende call site (GameStateDtoMapper) om
    // 'm expliciet te vullen — een vergeten veld geeft een bouwfout, geen stille lege lijst.
    IReadOnlyList<string> Winners,
    TvDisplaySettingsDto TvDisplay,
    TvDisplaySettingsDto TvDisplayDefault,
    IReadOnlyList<ContinentDto> Continents,
    IReadOnlyList<EventSummaryDto> Events,
    int NextCardTradeValue,
    OrderRollStateDto? OrderRollState = null,
    SetupStateDto? SetupState = null,
    int StateVersion = 0,
    string? PendingWinnerPlayerId = null,
    int? StartingArmies = null);

/// <summary>
/// Een continent met z'n bonus en, als één speler het volledig bezit, wie dat is (spelinfo,
/// plan-testronde-tv punt 3). De server bepaalt het bezit (<see cref="RiskGame.Rules.State.GameState.OwnsEntireContinent"/>)
/// — dezelfde voorwaarde als de continentbonus bij het versterken; de client rekent het niet na
/// (frontend/CLAUDE.md). De weergavenaam komt client-side uit <c>locales/continents.ts</c>.
/// </summary>
public sealed record ContinentDto(string Id, int Bonus, string? OwnerPlayerId);

/// <summary>
/// Een gebeurteniskaart uit de catalogus van de kaartvariant (FO §9.2) — de "mogelijke kaarten" in
/// spelinfo. Naam en omschrijving komen client-side uit <c>locales/events.ts</c>. Niet gefilterd op
/// <see cref="GameSettingsDto.EventsEnabled"/>, net zoals <see cref="GameStateDto.Roles"/> niet op
/// <see cref="GameSettingsDto.RolesEnabled"/>: de client verbergt de sectie als gebeurtenissen uit
/// staan.
/// </summary>
public sealed record EventSummaryDto(string Id, EventDurationDto Duration);

/// <summary>Draad-representatie van <see cref="RiskGame.Rules.Effects.EffectDuration"/>.</summary>
public enum EventDurationDto
{
    Instant,
    OneRound,
}

/// <summary>
/// Alles wat een client tijdens <see cref="GamePhaseDto.Claiming"/>/
/// <see cref="GamePhaseDto.InitialPlacement"/> nodig heeft om de startopstelling te tonen
/// zónder zelf spelregels na te rekenen (FO §5.1). <see cref="GameStateDto.TurnState"/> is in
/// deze fases nog <c>null</c>; de mapper leidt alles hier af via dezelfde calculators en guards
/// die de server-side validatie gebruikt.
/// </summary>
/// <param name="ActivePlayerId">
/// Wie er aan zet is. <c>null</c> tijdens <see cref="GamePhaseDto.InitialPlacement"/> bij
/// <see cref="RiskGame.Rules.State.SetupMode.Random"/>: daar plaatst iedereen gelijktijdig, er
/// is geen "actieve" speler (FO §5.1). Dat onderscheid is hiermee volledig af te lezen — een
/// client hoort er géén tweede veld of de opstelmodus voor nodig te hebben.
/// </param>
/// <param name="RemainingArmiesByPlayer">
/// Hoeveel startlegers elke speler nog moet plaatsen
/// (<see cref="RiskGame.Rules.TurnFlow.SetupTurnCalculator.RemainingArmiesFor"/>). Per speler en
/// niet alleen voor de ontvanger: de state-push gaat naar de hele spelgroep, en legeraantallen
/// zijn openbaar.
/// </param>
/// <param name="ClaimableTerritoryIdsByPlayer">
/// Welke gebieden elke speler mag claimen
/// (<see cref="RiskGame.Rules.Validation.SetupGuards.ClaimableTerritoryIdsFor"/>): vrije gebieden
/// minus het eigen rol-herkomstland (FO §8.1). Per speler verschillend, en dat lekt niets: rollen
/// zijn openbaar (FO §8) en het herkomstland is al af te leiden uit <see cref="PlayerDto.RoleId"/>
/// plus <see cref="RoleSummaryDto.OriginTerritory"/>, die beide naar iedereen gaan. Wordt dat ooit
/// verborgen informatie, dan moet dit veld mee naar de per-speler-push (TO §6.1).
/// Let op bij groei: dit is het eerste veld dat kwadratisch meeschaalt (spelers × gebieden) en het
/// gaat bij elke claim opnieuw naar iedereen. Op deze schaal verwaarloosbaar; knelt de payload
/// ooit, dan is dit de plek — de lijsten zijn per speler bijna identiek.
/// </param>
public sealed record SetupStateDto(
    string? ActivePlayerId,
    IReadOnlyDictionary<string, int> RemainingArmiesByPlayer,
    IReadOnlyDictionary<string, IReadOnlyList<string>> ClaimableTerritoryIdsByPlayer);

/// <summary>
/// Draad-representatie van de territoriumcatalogus van de kaartvariant
/// (<see cref="RiskGame.Rules.Map.Territory"/>) — continent + aangrenzende gebieden; de
/// weergavenaam komt client-side via <c>tDynamic(id, 'territories')</c>
/// (frontend/src/locales/territories.ts), nooit het <c>Name</c>-veld uit de brondata (zelfde
/// patroon als <c>RoleSummaryDto</c>). Statische data, bewust los van <see cref="GameStateDto"/>:
/// verandert nooit tijdens een spel, dus geen reden om 'm op elke state-push mee te sturen.
/// <c>NeighborTerritoryIds</c> spiegelt <see cref="RiskGame.Rules.Map.AdjacencyGraph.Neighbours"/>
/// — nodig voor de Attack-fase (welke gebieden kunnen vanuit een gekozen bron aangevallen
/// worden) zonder dat de client de bevroren adjacency-data zelf zou moeten naspelen
/// (frontend/CLAUDE.md: geen spelregel-/kaartdata-duplicatie).
/// </summary>
public sealed record TerritoryCatalogDto(string Id, string Continent, IReadOnlyList<string> NeighborTerritoryIds);

/// <summary>
/// Wie er nu nog mag gooien voor de spelersvolgorde (FO §2.1). Alleen gevuld door
/// <c>StartGame</c> (bij binnenkomst in de fase: iedereen) en <c>RollForOrder</c> (de
/// tie-break-voortgang uit <see cref="RiskGame.Rules.TurnFlow.OrderRollCalculator"/> — al
/// berekend, dus geen event-stream-toegang nodig in de mapper). <c>WatchGame</c> levert dit
/// veld niet: reconnect midden in een order-roll is bouwstap 6.
/// </summary>
public sealed record OrderRollStateDto(IReadOnlyList<string> PlayersStillToRoll);

/// <summary>
/// Draad-representatie van de kleurencatalogus van de kaartvariant
/// (<see cref="RiskGame.Rules.Map.PlayerColor"/>) — nooit hardcoden aan de TS-kant
/// (src/CLAUDE.md, DRY), dus de volledige catalogus (incl. hex/symbol) gaat mee met de
/// state. <see cref="GameStateDto.AvailableColorIds"/> blijft de lijst van nog vrije id's.
/// </summary>
public sealed record PlayerColorDto(string Id, string Name, string Hex, string OnHex, string Symbol);

/// <summary>
/// Draad-representatie van de rolcatalogus voor de rolkeuzestap (FO §8/§10, alleen
/// relevant bij RoleAssignment = Kiezen) — zonder het effect-detail; dat is spellogica die
/// de server toepast, niet iets dat de client zelf hoeft te tonen om te kunnen kiezen.
/// <paramref name="OriginTerritory"/> is het herkomstland (territory-id) waar de rolbonus
/// aan gekoppeld is; de client toont dat naast de rolnaam (join-flow, design Telefoon L316/L345).
/// </summary>
public sealed record RoleSummaryDto(string Id, string Name, string Description, string OriginTerritory);

public sealed record TerritoryDto(string TerritoryId, string? OwnerPlayerId, int ArmyCount);

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.Map.Card"/> — een territoriumkaart of
/// joker (<c>TerritoryId is null</c>). Alleen gevuld op <see cref="PlayerDto.Hand"/> voor de
/// speler die 'm zelf mag zien (TO §6.1); zie <see cref="GameStateDtoMapper.RedactForTv"/> en
/// <see cref="GameStateDtoMapper.RedactForPlayer"/>.
/// </summary>
public sealed record CardDto(string Id, string? TerritoryId, string Symbol);

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.State.TurnState"/>.
/// </summary>
/// <param name="ReinforcementBreakdown">
/// Alleen gevuld tijdens <see cref="TurnPhaseDto.Reinforce"/> (telefoon-"Opbouw"-paneel)
/// — <c>null</c> in Attack/Fortify, waar het niet van toepassing is.
/// Berekend uit de actuele state, niet uit een bij fase-intrede vastgezet snapshot: gebiedsbezit
/// verandert niet tijdens Reinforce, dus levert dat dezelfde optellermen als toen
/// <see cref="ArmiesRemaining"/> voor het eerst werd gezet. Openbaar zoals <c>ArmiesRemaining</c>
/// zelf al is (geen nieuwe privacy-grens, TO §6.1 blijft ongemoeid).
/// </param>
/// <param name="ReachableFortifyGroups">
/// Alleen gevuld tijdens <see cref="TurnPhaseDto.Fortify"/> (leeg daarbuiten): de eigen gebieden
/// van de actieve speler, verdeeld in samenhangende groepen
/// (<see cref="RiskGame.Rules.Fortify.FortifyGuards.ReachableComponents"/>). Bereikbaarheid is
/// symmetrisch, dus "bereikbaar vanuit gebied X" is simpelweg de rest van X's groep — de client
/// filtert de doellijst hiermee zonder zelf een pad-/effectregel na te bouwen
/// (frontend/CLAUDE.md: geen spelregels client-side).
/// </param>
/// <param name="MustTradeInCards">
/// Of de actieve speler moet inleggen vóór elke andere actie — de telefoon mag deze
/// spelregel niet zelf nabouwen (frontend/CLAUDE.md), dus de server levert de vlag.
/// Fase-bewust, met een andere drempel per fase: in <see cref="TurnPhaseDto.Reinforce"/>
/// bij 5+ kaarten (FO §5.2), in <see cref="TurnPhaseDto.Attack"/> bij 6+ kaarten ná een
/// eliminatie (FO §7); in elke andere fase <see langword="false"/>.
/// </param>
/// <param name="FortifiesRemaining">
/// Hoeveel keer de actieve speler deze fase nog mag <c>Fortify</c>en (normaal 1, met een
/// actieve <c>FortifyUpgrade/moves</c>-rolboost meer — FO §8.1). Al verrekend met
/// <see cref="RiskGame.Rules.Fortify.FortifyGuards.MaxMoves"/>, dus de telefoon hoeft die
/// spelregel niet zelf na te bouwen (frontend/CLAUDE.md) — 0 betekent klaar deze fase.
/// </param>
public sealed record TurnStateDto(
    string ActivePlayerId,
    TurnPhaseDto TurnPhase,
    int ArmiesRemaining,
    PendingCombatDto? PendingCombat,
    TurnTimerDto? Timer,
    IReadOnlyList<IReadOnlyList<string>> ReachableFortifyGroups,
    ReinforcementBreakdownDto? ReinforcementBreakdown = null,
    int FortifiesRemaining = 0,
    bool MustTradeInCards = false);

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.Reinforcement.ReinforcementBreakdown"/> —
/// dezelfde vier optellermen als <see cref="RiskGame.Rules.Reinforcement.ReinforcementCalculator.CalculateArmies"/>,
/// plus <see cref="CardTradeBonus"/> voor de "Kaarteninleg"-rij van de opbouw-uitsplitsing.
/// </summary>
/// <param name="CardTradeBonus">
/// Som van <c>SetValue</c> over de nog niet volledig geplaatste inlegs van déze fase
/// (<see cref="RiskGame.Rules.State.TurnState.UnsettledTrades"/>, taak 4b) — dus niet de
/// bezitsbonussen (die staan al los op de gebieden zelf) en niet inlegs van een eerdere
/// fase (die zijn dan al volledig geplaatst of teruggedraaid). 0 zolang er niets ingelegd is.
/// </param>
public sealed record ReinforcementBreakdownDto(
    int BaseArmies, int ContinentBonus, int RoleBonus, int EventBonus, int CardTradeBonus = 0);

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.State.PendingCombat"/>.
/// </summary>
/// <param name="AttackerRolls">
/// De actuele aanvalsworp — na een herwerp de nieuwe, gesorteerde worp (plan-rollen C5). Leidend
/// voor de telefoon-/TV-weergave tijdens de herwerp-stap; de server gebruikt 'm ook zelf als
/// bron voor <c>ChooseDefenseDice</c> (niet de losse <c>DiceRolled</c>-audittrail, FO §5.3).
/// </param>
/// <param name="AwaitingRerollDecision">
/// Of de aanvaller nog "Herwerp"/"Doorgaan" moet kiezen vóór de verdediger mag reageren (FO
/// §5.3 stap 3, §8.1) — de telefoon/TV mogen deze stap niet zelf uit een actieve rol afleiden
/// (frontend/CLAUDE.md), dus de server levert de vlag.
/// </param>
public sealed record PendingCombatDto(
    string FromTerritoryId,
    string ToTerritoryId,
    int AttackDice,
    IReadOnlyList<int> AttackerRolls,
    bool AwaitingRerollDecision);

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.State.PhaseTimer"/> (FO §5.4) — bewust
/// relatief (<see cref="RemainingMs"/>) en niet een absolute deadline: een client die zijn
/// eigen wandklok tegen een serverdeadline afzet, introduceert klokdrift tussen TV en
/// telefoon als categorie. Deze waarde wordt op serialisatiemoment berekend
/// (<c>GameStateDtoMapper</c>) uit <c>Remaining − (nu − LastUpdatedUtc)</c>, geklemd op 0 —
/// nooit negatief, ook niet in het venster tussen een verlopen timer en de daadwerkelijke
/// serverzijdige faseovergang.
/// </summary>
public sealed record TurnTimerDto(int RemainingMs, bool IsPaused);

public enum TurnPhaseDto
{
    Reinforce,
    Attack,
    Fortify,
}

public enum GamePhaseDto
{
    Lobby,
    OrderRoll,
    Claiming,
    InitialPlacement,
    InProgress,
    Finished,
}
