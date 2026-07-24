using Marten;
using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;

namespace RiskGame.Api.Hubs;

public sealed record JoinGameResponse(string PlayerId, GameStateDto State);

public sealed record OrderRollResponse(int Die1, int Die2, GameStateDto State);

public sealed record DeclareAttackResponse(IReadOnlyList<int> AttackerRolls, GameStateDto State);

public sealed record CombatResultResponse(
    IReadOnlyList<int> AttackerRolls,
    IReadOnlyList<int> DefenderRolls,
    int AttackerLosses,
    int DefenderLosses,
    bool Conquered,
    GameStateDto State);

/// <summary>
/// Transiënt audit/weergave-event (geen state) voor elke dobbelworp die op de TV zichtbaar
/// moet zijn: order-roll (FO §2.1) en de aanvals-/verdedigingsworp tijdens gevechten (FO §5.3).
/// <c>Context</c> is bewust een string, geen enum — puur een weergave-label, geen domeinbegrip.
/// </summary>
public sealed record DiceRolledMessage(string PlayerId, IReadOnlyList<int> Dice, string Context);

/// <summary>
/// SignalR-hub voor alle spelcommando's (TO §4.1): lobby, order-roll, startopstelling,
/// rol-/missietoewijzing, versterken, aanvallen en de generieke beurtoverstap (Fortify/
/// EndPhase/EndTurn). Dun: elke methode delegeert de TO §4-pijplijn naar de bijbehorende
/// command handler en zet een mislukt <see cref="Result{T}"/> om in een
/// <see cref="HubException"/> — de enige manier om een foutmelding terug te geven zonder
/// de state van andere clients te raken.
/// </summary>
/// <remarks>
/// Groepen (TO §6.1): één groep per spel, <c>game-{id}-all</c>. De tv-specifieke en
/// per-speler-privé-groepen volgen in een latere plak zodra er daadwerkelijk privé-DTO's
/// (handkaarten/geheime missies) gepusht moeten worden — nu zou dat ongebruikte
/// infrastructuur zijn. Sessietokens/reconnect (TO §6.3) volgen in bouwstap 6.
/// </remarks>
public sealed class GameHub(
    IDocumentStore store,
    LobbyCommandHandler lobbyCommands,
    OrderRollCommandHandler orderRollCommands,
    SetupCommandHandler setupCommands,
    ReinforceCommandHandler reinforceCommands,
    AttackCommandHandler attackCommands,
    TurnFlowCommandHandler turnFlowCommands) : Hub<IGameClient>
{
    /// <summary>
    /// Voegt de aanroepende connectie toe aan de spelgroep en levert de huidige state —
    /// de enige aanroep die de TV doet na het (handmatig) navigeren naar <c>/tv/:gameId</c>.
    /// </summary>
    public async Task<GameStateDto> WatchGame(string gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(gameId));

        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            throw new HubException($"Onbekend spel '{gameId}'.");
        }

        return GameStateDtoMapper.ToDto(state) with { StateVersion = await FetchStateVersionAsync(session, gameId) };
    }

    public async Task<JoinGameResponse> JoinGame(string gameId, string playerName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(gameId));

        var result = await lobbyCommands.JoinGameAsync(gameId, playerName);

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            joinResult => new JoinGameResponse(joinResult.PlayerId, joinResult.State),
            r => r.State,
            (r, s) => r with { State = s });
    }

    public async Task<GameStateDto> RejoinGame(string gameId, string playerId)
    {
        await using var session = store.QuerySession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            throw new HubException($"Onbekend spel '{gameId}'.");
        }

        if (!state.HasPlayer(playerId))
        {
            throw new HubException($"Onbekende speler '{playerId}' voor spel '{gameId}'.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(gameId));

        return GameStateDtoMapper.ToDto(state) with { StateVersion = await FetchStateVersionAsync(session, gameId) };
    }

    public async Task<GameStateDto> ChooseColor(string gameId, string playerId, string colorId)
    {
        var result = await lobbyCommands.ChooseColorAsync(gameId, playerId, colorId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> StartGame(string gameId, string playerId)
    {
        var result = await lobbyCommands.StartGameAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> SelectRole(string gameId, string playerId, string roleId)
    {
        var result = await lobbyCommands.SelectRoleAsync(gameId, playerId, roleId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<OrderRollResponse> RollForOrder(string gameId, string playerId)
    {
        var result = await orderRollCommands.RollForOrderAsync(gameId, playerId);

        if (result.IsSuccess)
        {
            await Clients.Group(GroupName(gameId)).DiceRolled(
                new DiceRolledMessage(playerId, [result.Value.Die1, result.Value.Die2], "order-roll"));
        }

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            rollResult => new OrderRollResponse(rollResult.Die1, rollResult.Die2, rollResult.State),
            r => r.State,
            (r, s) => r with { State = s });
    }

    public async Task<GameStateDto> ClaimTerritory(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.ClaimTerritoryAsync(gameId, playerId, territoryId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> PlaceInitialArmy(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.PlaceInitialArmyAsync(gameId, playerId, territoryId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> PlaceReinforcements(
        string gameId, string playerId, string territoryId, int amount)
    {
        var result = await reinforceCommands.PlaceReinforcementsAsync(gameId, playerId, territoryId, amount);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> TradeInCards(string gameId, string playerId, string[] cardIds)
    {
        var result = await reinforceCommands.TradeInCardsAsync(gameId, playerId, cardIds);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<DeclareAttackResponse> DeclareAttack(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int attackDice)
    {
        var result = await attackCommands.DeclareAttackAsync(
            gameId, playerId, fromTerritoryId, toTerritoryId, attackDice);

        if (result.IsSuccess)
        {
            await Clients.Group(GroupName(gameId)).DiceRolled(
                new DiceRolledMessage(playerId, result.Value.AttackerRolls, "attack"));
        }

        return await UnwrapAndBroadcastAsync(
            gameId,
            result,
            declareResult => new DeclareAttackResponse(declareResult.AttackerRolls, declareResult.State),
            r => r.State,
            (r, s) => r with { State = s });
    }

    public async Task<CombatResultResponse> ChooseDefenseDice(string gameId, string playerId, int defenseDice)
    {
        var result = await attackCommands.ChooseDefenseDiceAsync(gameId, playerId, defenseDice);

        if (result.IsSuccess)
        {
            await Clients.Group(GroupName(gameId)).DiceRolled(
                new DiceRolledMessage(playerId, result.Value.DefenderRolls, "defense"));
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
            (r, s) => r with { State = s });
    }

    public async Task<GameStateDto> MoveAfterConquest(string gameId, string playerId, int armiesToMove)
    {
        var result = await attackCommands.MoveAfterConquestAsync(gameId, playerId, armiesToMove);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> Fortify(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int armiesToMove)
    {
        var result = await turnFlowCommands.FortifyAsync(gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> EndPhase(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndPhaseAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    public async Task<GameStateDto> EndTurn(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndTurnAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state, (_, s) => s);
    }

    private static string GroupName(string gameId) => $"game-{gameId}-all";

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
    /// commando pusht de bijgewerkte state naar de hele spelgroep, niet alleen naar de
    /// aanroeper. Dit is ook de plek waar een toekomstige privacy-grens (TO §6.1) zou
    /// landen zodra er privé-DTO's bijkomen.
    /// </summary>
    private async Task<TResponse> UnwrapAndBroadcastAsync<T, TResponse>(
        string gameId,
        Result<T> result,
        Func<T, TResponse> onSuccess,
        Func<TResponse, GameStateDto> extractState,
        Func<TResponse, GameStateDto, TResponse> withState)
    {
        if (!result.IsSuccess)
        {
            throw new HubException(string.Join(" | ", result.Errors));
        }

        var response = onSuccess(result.Value);

        await using var session = store.QuerySession();
        var versionedState = extractState(response) with { StateVersion = await FetchStateVersionAsync(session, gameId) };
        response = withState(response, versionedState);

        await Clients.Group(GroupName(gameId)).GameStateUpdated(versionedState);

        return response;
    }
}
