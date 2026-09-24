using System.Security.Cryptography;
using System.Text;
using Marten;
using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Sessions;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Hubs;

public sealed record JoinGameResponse(string PlayerId, GameStateDto State, string SessionToken);

public sealed record OrderRollResponse(int Die1, int Die2, GameStateDto State);

public sealed record DeclareAttackResponse(IReadOnlyList<int> AttackerRolls, GameStateDto State);

/// <summary>RPC-antwoord op <c>RerollAttackDie</c> — zelfde velden als de bijbehorende <see cref="DiceRolledMessage"/>
/// (<c>Context == "reroll"</c>), zodat de aanroeper zelf niet op de broadcast hoeft te wachten.</summary>
public sealed record RerollAttackDieResponse(
    IReadOnlyList<int> PreviousRolls, int RerolledDieIndex, int NewValue, IReadOnlyList<int> Rolls, GameStateDto State);

public sealed record CombatResultResponse(
    IReadOnlyList<int> AttackerRolls,
    IReadOnlyList<int> DefenderRolls,
    int AttackerLosses,
    int DefenderLosses,
    bool Conquered,
    GameStateDto State);

/// <summary>
/// Narratieve-broadcast-familie (TO §6.1, "globale gebeurtenissen"): naast de pure
/// state-snapshot in <see cref="GameStateDto"/> broadcast de hub transiënte
/// audit/weergave-events (geen state) naar de hele spelgroep, zodat de TV kan tonen wát
/// er gebeurde, niet alleen wat het eindresultaat is. Elke soort krijgt een eigen
/// <c>sealed record ...Message</c> hier en een eigen <c>Task ...Narrated(...)</c>/
/// <c>Task ...Rolled(...)</c> op <see cref="IGameClient"/> — geen gedeeld "fat message"-type
/// met nullable velden per soort (src/CLAUDE.md, Open/Closed). <see cref="DiceRolledMessage"/>
/// is het eerste lid van deze familie; <see cref="CombatNarratedMessage"/> hieronder is de
/// referentie-implementatie voor een volledig narratief event (met <c>CorrelationId</c> en
/// <c>StateVersion</c>) voor toekomstige toevoegingen (bv. event-kaart-narratie).
/// </summary>
/// <remarks>
/// Transiënt audit/weergave-event (geen state) voor elke dobbelworp die op de TV zichtbaar
/// moet zijn: order-roll (FO §2.1), de aanvals-/verdedigingsworp tijdens gevechten (FO §5.3), een
/// rol-herwerp (FO §8.1, plan-rollen C5) en een verdedigingsworp met ingezette <c>DefenseBoost</c>
/// (<c>"defenseBoost"</c>, FO §8.1). <c>Context</c> is bewust een string, geen enum —
/// puur een weergave-label, geen domeinbegrip. <c>CorrelationId</c> is <c>null</c> bij order-roll
/// (geen gevecht om aan te correleren) en gelijk aan <see cref="Rules.State.PendingCombat.CorrelationId"/>
/// bij attack/defense/reroll.
/// </remarks>
/// <param name="Dice">
/// De worp die getoond moet worden — bij <c>Context == "reroll"</c> de nieuwe, gesorteerde worp
/// ná de herwerp, zodat elke consument van deze narratieve familie hetzelfde "eindresultaat"-veld
/// kan lezen ongeacht <c>Context</c>.
/// </param>
/// <param name="PreviousRolls">
/// Alleen gevuld bij <c>Context == "reroll"</c>: de worp zoals die vóór de herwerp stond — de TV
/// highlight <paramref name="RerolledDieIndex"/> hierin vóórdat 'm naar <paramref name="Dice"/>
/// animeert (plan-rollen B2).
/// </param>
/// <param name="RerolledDieIndex">
/// Alleen gevuld bij <c>Context == "reroll"</c>: de positie van de herworpen dobbelsteen in
/// <paramref name="PreviousRolls"/> — vóór de hersortering door <see cref="Rules.Combat.CombatResolver.RerollDie"/>,
/// dus een index in <paramref name="Dice"/> zou hier betekenisloos zijn (plan-rollen C5).
/// </param>
/// <param name="NewValue">Alleen gevuld bij <c>Context == "reroll"</c>: de nieuw gegooide waarde.</param>
public sealed record DiceRolledMessage(
    string PlayerId,
    IReadOnlyList<int> Dice,
    string Context,
    Guid? CorrelationId,
    IReadOnlyList<int>? PreviousRolls = null,
    int? RerolledDieIndex = null,
    int? NewValue = null);

/// <summary>
/// Combat-resolutie als narratief event (FO §5.3): wie viel wie aan, vanuit/naar welk
/// gebied, met welke verliezen, en of het gebied viel of een speler uitgeschakeld raakte.
/// <c>StateVersion</c> is de versie die dit gevecht oplevert — een consument gebruikt 'm om
/// dit event te koppelen aan de bijbehorende <see cref="GameStateDto.StateVersion"/> (zelfde
/// verdediging als <c>useTvGame.applyState</c> al toepast op het state-kanaal) in plaats van
/// op aankomstvolgorde te vertrouwen. <c>CorrelationId</c> is gelijk aan die op de
/// <see cref="DiceRolledMessage"/>-events van dezelfde actie.
/// </summary>
public sealed record CombatNarratedMessage(
    Guid CorrelationId,
    string AttackerId,
    string DefenderId,
    string FromTerritoryId,
    string ToTerritoryId,
    int AttackerLosses,
    int DefenderLosses,
    bool Conquered,
    string? EliminatedPlayerId,
    int StateVersion);

/// <summary>
/// Een gebied is zojuist geclaimd (FO §5.1, <see cref="RiskGame.Rules.State.GamePhase.Claiming"/>).
/// Narratief event, geen state: de TV gebruikt dit om de laatst-geclaimde-gebied-flare te tonen
/// zonder twee <c>GameStateDto.Territories</c>-snapshots te hoeven diffen — dat zou breken bij
/// reconnect (geen vorige snapshot), meerdere claims tussen twee broadcasts, en de
/// rollback/vertrek-richting (waarbij <c>ownerPlayerId</c> juist leeg raakt, geen claim is).
/// </summary>
public sealed record TerritoryClaimedMessage(string TerritoryId, string PlayerId, int StateVersion);

/// <summary>
/// Het spel is zojuist beëindigd (FO §6/§7): wie er gewonnen heeft. Narratief naast de
/// state-snapshot, zelfde reden als <see cref="CombatNarratedMessage"/> — de TV moet kunnen
/// tonen dát er zojuist gewonnen is, niet alleen dat <see cref="GameStateDto.Phase"/> nu
/// <see cref="RiskGame.Api.Dtos.GamePhaseDto.Finished"/> is. <c>WinnerPlayerIds</c> spiegelt
/// <see cref="GameStateDto.Winners"/> — kan meer dan één speler bevatten (FO §6.1).
/// </summary>
public sealed record GameWonMessage(IReadOnlyList<string> WinnerPlayerIds, int StateVersion);

/// <summary>
/// SignalR-hub voor alle spelcommando's (TO §4.1): lobby, order-roll, startopstelling,
/// rol-/missietoewijzing, versterken, aanvallen en de generieke beurtoverstap (Fortify/
/// EndPhase/EndTurn). Dun: elke methode delegeert de TO §4-pijplijn naar de bijbehorende
/// command handler en zet een mislukt <see cref="Result{T}"/> om in een
/// <see cref="HubException"/> — de enige manier om een foutmelding terug te geven zonder
/// de state van andere clients te raken.
/// </summary>
/// <remarks>
/// Groepen (TO §6.1): <c>game-{id}-all</c> (narratieve broadcasts zonder privé-info),
/// <c>game-{id}-tv</c> (volledige publieke state) en <c>game-{id}-player-{playerId}</c>
/// (publieke state plus de eigen Hand/Mission). <see cref="GameStatePush"/> is de enige plek
/// die de laatste twee daadwerkelijk vult — zie die klasse voor de privacy-grens zelf.
/// <see cref="RejoinGame"/> koppelt alleen aan de player-groep, en geeft alleen de eigen
/// Hand/Mission mee, wanneer het meegestuurde sessietoken (TO §6.3) overeenkomt met het
/// token dat <see cref="JoinGame"/> ooit uitgaf — zie de doc-comment op die methode.
/// </remarks>
public sealed class GameHub(
    IDocumentStore store,
    LobbyCommandHandler lobbyCommands,
    OrderRollCommandHandler orderRollCommands,
    SetupCommandHandler setupCommands,
    ReinforceCommandHandler reinforceCommands,
    AttackCommandHandler attackCommands,
    TurnFlowCommandHandler turnFlowCommands,
    TvDisplayCommandHandler tvDisplayCommands,
    TimeProvider timeProvider) : Hub<IGameClient>
{
    /// <summary>
    /// Voegt de aanroepende connectie toe aan de spelgroep en levert de huidige state —
    /// de enige aanroep die de TV doet na het (handmatig) navigeren naar <c>/tv/:gameId</c>.
    /// </summary>
    public async Task<GameStateDto> WatchGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.All(gameId));
        await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.Tv(gameId));

        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            throw new HubException(HubErrorSerializer.Serialize(
                new ValidationError("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId })));
        }

        var dto = GameStateDtoMapper.ToDto(state, timeProvider) with { StateVersion = await FetchStateVersionAsync(session, gameId) };

        return GameStateDtoMapper.RedactForTv(dto);
    }

    public async Task<JoinGameResponse> JoinGame(string gameId, string playerName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.All(gameId));

        var result = await lobbyCommands.JoinGameAsync(gameId, playerName);

        if (result.IsSuccess)
        {
            // Veilig: playerId is hier net server-side gegenereerd (Guid.NewGuid() in
            // LobbyCommandHandler) en gaat uitsluitend naar de aanroepende verbinding terug —
            // anders dan bij RejoinGame vóórdat het een sessietoken vereiste, is er hier niets
            // te impersoneren: de identiteit (én het token) ontstaan pas in dit moment.
            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.Player(gameId, result.Value.PlayerId));

            // De telefoon roept vóór het joinen WatchGame aan (voor het kleurenpalet op de
            // join-stap) en zit daardoor ook in de tv-groep. Een connectie die speler wordt
            // moet daar weer uit: anders krijgt hij elke broadcast dubbel — eerst de
            // tv-geredacte versie, dan de eigen — met hetzelfde StateVersion, en de client
            // (useGameState.applyState) negeert de tweede als "niet nieuwer". Netto verdwijnen
            // dan de eigen Hand/MissionId. Idempotent voor een connectie die nooit keek.
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, GameGroups.Tv(gameId));
        }

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            joinResult => new JoinGameResponse(joinResult.PlayerId, joinResult.State, joinResult.SessionToken),
            r => r.State,
            (r, s) => r with { State = s },
            r => r.PlayerId);
    }

    /// <summary>
    /// <paramref name="playerId"/> is een kale, publiek bekende string — elke verbonden client
    /// kent elkaars <c>playerId</c> al via <see cref="GameStateDto.Players"/>. Het bewijs van
    /// identiteit is <paramref name="sessionToken"/> (TO §6.3): <see cref="JoinGame"/> geeft dat
    /// eenmalig terug aan de joinende connectie, opgeslagen als <see cref="PlayerSessionToken"/>.
    /// Komt het meegestuurde token overeen met het opgeslagen token voor deze
    /// <paramref name="playerId"/>, dan koppelt deze aanroep alsnog aan
    /// <see cref="GameGroups.Player"/> en krijgt de aanroeper de eigen Hand/Mission. Zonder
    /// geldig token (nog geen token bekend, of een client die alleen de publieke
    /// <paramref name="playerId"/> kent maar niet het bijbehorende token) degradeert dit naar de
    /// publieke, tv-achtige weergave — nooit een foutmelding: dat houdt reconnect altijd
    /// werkend, ook wanneer er (nog) geen token voor deze speler bestaat.
    /// </summary>
    public async Task<GameStateDto> RejoinGame(string gameId, string playerId, string sessionToken = "")
    {
        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            throw new HubException(HubErrorSerializer.Serialize(
                new ValidationError("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId })));
        }

        if (!state.HasPlayer(playerId))
        {
            throw new HubException(HubErrorSerializer.Serialize(
                new ValidationError("common.unknownPlayer", new Dictionary<string, string> { ["playerId"] = playerId })));
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.All(gameId));

        var dto = GameStateDtoMapper.ToDto(state, timeProvider) with { StateVersion = await FetchStateVersionAsync(session, gameId) };

        var stored = await session.LoadAsync<PlayerSessionToken>(playerId);

        if (stored is not null && sessionToken.Length > 0 && TokensMatch(stored.Token, sessionToken))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, GameGroups.Player(gameId, playerId));

            return GameStateDtoMapper.RedactForPlayer(dto, playerId);
        }

        return GameStateDtoMapper.RedactForTv(dto);
    }

    public async Task<GameStateDto> ChooseColor(string gameId, string playerId, string colorId)
    {
        var result = await lobbyCommands.ChooseColorAsync(gameId, playerId, colorId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> StartGame(string gameId, string playerId)
    {
        var result = await lobbyCommands.StartGameAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> SelectRole(string gameId, string playerId, string roleId)
    {
        var result = await lobbyCommands.SelectRoleAsync(gameId, playerId, roleId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> RemovePlayer(string gameId, string playerId, string targetPlayerId)
    {
        var result = await lobbyCommands.RemovePlayerAsync(gameId, playerId, targetPlayerId);

        var response = await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);

        if (result.IsSuccess)
        {
            // PlayerRemoved haalt targetPlayerId volledig uit state.Players (GameProjection),
            // dus GameStatePush.BroadcastAsync (dat over state.Players itereert) pusht niet meer
            // naar diens eigen groep — hij zou anders stilzwijgend nooit meer iets horen. Eén
            // gerichte push hier houdt dat gedrag gelijk aan vóór de tv/player-groepensplitsing.
            await Clients.Group(GameGroups.Player(gameId, targetPlayerId)).GameStateUpdated(
                GameStateDtoMapper.RedactForTv(response));
        }

        return response;
    }

    public async Task<OrderRollResponse> RollForOrder(string gameId, string playerId)
    {
        var result = await orderRollCommands.RollForOrderAsync(gameId, playerId);

        if (result.IsSuccess)
        {
            await Clients.Group(GameGroups.All(gameId)).DiceRolled(
                new DiceRolledMessage(playerId, [result.Value.Die1, result.Value.Die2], "order-roll", null));
        }

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            rollResult => new OrderRollResponse(rollResult.Die1, rollResult.Die2, rollResult.State),
            r => r.State,
            (r, s) => r with { State = s },
            _ => playerId);
    }

    public async Task<GameStateDto> ClaimTerritory(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.ClaimTerritoryAsync(gameId, playerId, territoryId);

        if (result.IsSuccess)
        {
            await using var versionSession = store.QuerySession();

            await Clients.Group(GameGroups.All(gameId)).TerritoryClaimed(new TerritoryClaimedMessage(
                territoryId, playerId, await FetchStateVersionAsync(versionSession, gameId)));
        }

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> PlaceInitialArmy(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.PlaceInitialArmyAsync(gameId, playerId, territoryId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> PlaceReinforcements(
        string gameId, string playerId, string territoryId, int amount)
    {
        var result = await reinforceCommands.PlaceReinforcementsAsync(gameId, playerId, territoryId, amount);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> TradeInCards(string gameId, string playerId, string[] cardIds)
    {
        var result = await reinforceCommands.TradeInCardsAsync(gameId, playerId, cardIds);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<DeclareAttackResponse> DeclareAttack(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int attackDice)
    {
        var result = await attackCommands.DeclareAttackAsync(
            gameId, playerId, fromTerritoryId, toTerritoryId, attackDice);

        if (result.IsSuccess)
        {
            await Clients.Group(GameGroups.All(gameId)).DiceRolled(
                new DiceRolledMessage(playerId, result.Value.AttackerRolls, "attack", result.Value.CorrelationId));
        }

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            declareResult => new DeclareAttackResponse(declareResult.AttackerRolls, declareResult.State),
            r => r.State,
            (r, s) => r with { State = s },
            _ => playerId);
    }

    /// <summary>Verdedigen (FO §5.3 stap 4). <paramref name="useDefenseBoost"/> zet de
    /// <c>DefenseBoost</c>-rol in (FO §8.1); de worp gaat dan als <c>"defenseBoost"</c> over de
    /// narratieve broadcast in plaats van <c>"defense"</c>, zodat de TV de inzet kan tonen.</summary>
    public async Task<CombatResultResponse> ChooseDefenseDice(
        string gameId, string playerId, int defenseDice, bool useDefenseBoost)
    {
        var result = await attackCommands.ChooseDefenseDiceAsync(gameId, playerId, defenseDice, useDefenseBoost);

        if (result.IsSuccess)
        {
            await Clients.Group(GameGroups.All(gameId)).DiceRolled(new DiceRolledMessage(
                playerId,
                result.Value.DefenderRolls,
                result.Value.DefenseBoostUsed ? "defenseBoost" : "defense",
                result.Value.CorrelationId));

            await using var versionSession = store.QuerySession();

            await Clients.Group(GameGroups.All(gameId)).CombatNarrated(new CombatNarratedMessage(
                result.Value.CorrelationId,
                result.Value.AttackerId,
                result.Value.DefenderId,
                result.Value.FromTerritoryId,
                result.Value.ToTerritoryId,
                result.Value.AttackerLosses,
                result.Value.DefenderLosses,
                result.Value.Conquered,
                result.Value.EliminatedPlayerId,
                await FetchStateVersionAsync(versionSession, gameId)));

            if (result.Value.State.Winners.Count > 0)
            {
                await Clients.Group(GameGroups.All(gameId)).GameWon(new GameWonMessage(
                    result.Value.State.Winners, await FetchStateVersionAsync(versionSession, gameId)));
            }
        }

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            combatResult => new CombatResultResponse(
                combatResult.AttackerRolls,
                combatResult.DefenderRolls,
                combatResult.AttackerLosses,
                combatResult.DefenderLosses,
                combatResult.Conquered,
                combatResult.State),
            r => r.State,
            (r, s) => r with { State = s },
            _ => playerId);
    }

    /// <summary>"Herwerp" (FO §5.3 stap 3, §8.1): de aanvaller kiest zelf welke dobbelsteen van
    /// zijn eigen worp opnieuw gegooid wordt — alleen mogelijk zolang de herwerp-stap open staat
    /// (<see cref="RiskGame.Rules.Combat.AttackGuards.CanRerollAttackDie"/>).</summary>
    public async Task<RerollAttackDieResponse> RerollAttackDie(string gameId, string playerId, int dieIndex)
    {
        var result = await attackCommands.RerollAttackDieAsync(gameId, playerId, dieIndex);

        if (result.IsSuccess)
        {
            await Clients.Group(GameGroups.All(gameId)).DiceRolled(new DiceRolledMessage(
                playerId,
                result.Value.Rolls,
                "reroll",
                result.Value.CorrelationId,
                result.Value.PreviousRolls,
                result.Value.RerolledDieIndex,
                result.Value.NewValue));
        }

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            rerollResult => new RerollAttackDieResponse(
                rerollResult.PreviousRolls, rerollResult.RerolledDieIndex, rerollResult.NewValue, rerollResult.Rolls, rerollResult.State),
            r => r.State,
            (r, s) => r with { State = s },
            _ => playerId);
    }

    /// <summary>"Doorgaan" (FO §5.3 stap 3, §8.1): de aanvaller sluit de herwerp-stap zonder te
    /// herwerpen — verbruikt de beschikbare herwerp voor dit doelgebied niet (plan-rollen A8).</summary>
    public async Task<GameStateDto> KeepAttackDice(string gameId, string playerId)
    {
        var result = await attackCommands.KeepAttackDiceAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> MoveAfterConquest(string gameId, string playerId, int armiesToMove)
    {
        var result = await attackCommands.MoveAfterConquestAsync(gameId, playerId, armiesToMove);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> AbandonAttack(string gameId, string playerId)
    {
        var result = await attackCommands.AbandonAttackAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> Fortify(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int armiesToMove)
    {
        var result = await turnFlowCommands.FortifyAsync(gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> EndPhase(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndPhaseAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    public async Task<GameStateDto> EndTurn(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndTurnAsync(gameId, playerId);

        if (result.IsSuccess && result.Value.Winners.Count > 0)
        {
            await using var versionSession = store.QuerySession();

            await Clients.Group(GameGroups.All(gameId)).GameWon(new GameWonMessage(
                result.Value.Winners, await FetchStateVersionAsync(versionSession, gameId)));
        }

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    /// <summary>
    /// Host-only, in elke fase (plan-testronde-tv punt 2): legt de TV-weergave vast. Geen eigen
    /// broadcast-kanaal — het event hoogt de <see cref="GameStateDto.StateVersion"/> op, dus de TV
    /// pikt de nieuwe waarden op via de gewone state-push. Losse parameters i.p.v. een DTO-argument,
    /// zelfde stijl als de overige hub-methodes.
    /// </summary>
    public async Task<GameStateDto> SetTvDisplay(
        string gameId, string playerId, int textScale, int glassOpacity, int glassBlur, TvLanguageDto language)
    {
        var result = await tvDisplayCommands.SetTvDisplayAsync(
            gameId, playerId, new TvDisplaySettingsDto(textScale, glassOpacity, glassBlur, language));

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s, _ => playerId);
    }

    /// <summary>
    /// De echte, monotoon oplopende client-syncversie (TO §6) komt uit Martens eigen
    /// stream-versie, niet uit een zelf bijgehouden teller op <see cref="GameState"/>: zo'n
    /// teller zou bij elke herladen aggregate weer op 0 staan (Marten's <c>mt_version</c>
    /// leeft op de event-stream, niet in de JSONB-projectie van het document) — vandaar dat
    /// dit hier centraal wordt opgezocht in plaats van in het domein.
    /// </summary>
    private static async Task<int> FetchStateVersionAsync(IQuerySession session, string gameId)
    {
        var streamState = await session.Events.FetchStreamStateAsync(gameId);

        return (int)(streamState?.Version ?? 0);
    }

    /// <summary>
    /// Eén centrale plek voor de push-compositie (src/CLAUDE.md, API-grens): elk geslaagd
    /// commando pusht de bijgewerkte state naar tv- en per-speler-groepen (via
    /// <see cref="GameStatePush"/>, TO §6.1), niet alleen naar de aanroeper. Het directe
    /// RPC-antwoord aan de aanroeper wordt met dezelfde regel geredact —
    /// <paramref name="callerPlayerId"/> levert diens eigen speler-id (of <c>null</c> als de
    /// aanroeper geen speler is, bv. een toekomstige tv-only aanroep); zonder dat zou elk
    /// muterend commando de volledige, ongeredacte Hand/Mission van iedereen teruggeven.
    /// </summary>
    private async Task<TResponse> UnwrapAndBroadcastAsync<T, TResponse>(
        string gameId,
        Result<T> result,
        Func<T, TResponse> onSuccess,
        Func<TResponse, GameStateDto> extractState,
        Func<TResponse, GameStateDto, TResponse> withState,
        Func<TResponse, string?> callerPlayerId)
    {
        if (!result.IsSuccess)
        {
            throw new HubException(HubErrorSerializer.Serialize(result.Errors));
        }

        var response = onSuccess(result.Value);

        await using var session = store.QuerySession();
        var versionedState = extractState(response) with { StateVersion = await FetchStateVersionAsync(session, gameId) };

        await GameStatePush.BroadcastAsync(Clients, gameId, versionedState);

        var callerId = callerPlayerId(response);
        var responseState = callerId is null
            ? GameStateDtoMapper.RedactForTv(versionedState)
            : GameStateDtoMapper.RedactForPlayer(versionedState, callerId);

        return withState(response, responseState);
    }

    /// <summary>
    /// Vergelijkt een sessietoken (TO §6.3) in constante tijd i.p.v. met de standaard
    /// string-gelijkheid, die vroegtijdig stopt bij het eerste verschillende teken. Voor een
    /// geheim dat toegang geeft tot iemands privé Hand/Mission is een lengte-afhankelijke
    /// vergelijkingstijd een (in de praktijk lastig, maar reëel) timing-zijkanaal.
    /// </summary>
    private static bool TokensMatch(string expected, string actual)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expected);
        var actualBytes = Encoding.UTF8.GetBytes(actual);

        return expectedBytes.Length == actualBytes.Length
            && CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
    }
}
