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
    TurnFlowCommandHandler turnFlowCommands) : Hub
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

        return state is not null
            ? GameStateDtoMapper.ToDto(state)
            : throw new HubException($"Onbekend spel '{gameId}'.");
    }

    public async Task<JoinGameResponse> JoinGame(string gameId, string playerName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(gameId));

        var result = await lobbyCommands.JoinGameAsync(gameId, playerName);

        return await UnwrapAndBroadcastAsync(
            gameId, result, joinResult => new JoinGameResponse(joinResult.PlayerId, joinResult.State), r => r.State);
    }

    public async Task<GameStateDto> ChooseColor(string gameId, string playerId, string colorId)
    {
        var result = await lobbyCommands.ChooseColorAsync(gameId, playerId, colorId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> StartGame(string gameId, string playerId)
    {
        var result = await lobbyCommands.StartGameAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> SelectRole(string gameId, string playerId, string roleId)
    {
        var result = await lobbyCommands.SelectRoleAsync(gameId, playerId, roleId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<OrderRollResponse> RollForOrder(string gameId, string playerId)
    {
        var result = await orderRollCommands.RollForOrderAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(
            gameId, result, rollResult => new OrderRollResponse(rollResult.Die1, rollResult.Die2, rollResult.State), r => r.State);
    }

    public async Task<GameStateDto> ClaimTerritory(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.ClaimTerritoryAsync(gameId, playerId, territoryId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> PlaceInitialArmy(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.PlaceInitialArmyAsync(gameId, playerId, territoryId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> PlaceReinforcements(
        string gameId, string playerId, string territoryId, int amount)
    {
        var result = await reinforceCommands.PlaceReinforcementsAsync(gameId, playerId, territoryId, amount);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> TradeInCards(string gameId, string playerId, string[] cardIds)
    {
        var result = await reinforceCommands.TradeInCardsAsync(gameId, playerId, cardIds);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<DeclareAttackResponse> DeclareAttack(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int attackDice)
    {
        var result = await attackCommands.DeclareAttackAsync(
            gameId, playerId, fromTerritoryId, toTerritoryId, attackDice);

        return await UnwrapAndBroadcastAsync(
            gameId, result, declareResult => new DeclareAttackResponse(declareResult.AttackerRolls, declareResult.State), r => r.State);
    }

    public async Task<CombatResultResponse> ChooseDefenseDice(string gameId, string playerId, int defenseDice)
    {
        var result = await attackCommands.ChooseDefenseDiceAsync(gameId, playerId, defenseDice);

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
            r => r.State);
    }

    public async Task<GameStateDto> MoveAfterConquest(string gameId, string playerId, int armiesToMove)
    {
        var result = await attackCommands.MoveAfterConquestAsync(gameId, playerId, armiesToMove);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> Fortify(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int armiesToMove)
    {
        var result = await turnFlowCommands.FortifyAsync(gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> EndPhase(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndPhaseAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    public async Task<GameStateDto> EndTurn(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndTurnAsync(gameId, playerId);

        return await UnwrapAndBroadcastAsync(gameId, result, state => state, state => state);
    }

    private static string GroupName(string gameId) => $"game-{gameId}-all";

    /// <summary>
    /// Eén centrale plek voor de push-compositie (src/CLAUDE.md, API-grens): elk geslaagd
    /// commando pusht de bijgewerkte state naar de hele spelgroep, niet alleen naar de
    /// aanroeper. Dit is ook de plek waar een toekomstige privacy-grens (TO §6.1) zou
    /// landen zodra er privé-DTO's bijkomen.
    /// </summary>
    private async Task<TResponse> UnwrapAndBroadcastAsync<T, TResponse>(
        string gameId, Result<T> result, Func<T, TResponse> onSuccess, Func<TResponse, GameStateDto> extractState)
    {
        if (!result.IsSuccess)
        {
            throw new HubException(string.Join(" | ", result.Errors));
        }

        var response = onSuccess(result.Value);
        await Clients.Group(GroupName(gameId)).SendAsync("GameStateUpdated", extractState(response));

        return response;
    }
}
