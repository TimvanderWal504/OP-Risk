using Microsoft.AspNetCore.SignalR;
using RiskGame.Api.Commands;
using RiskGame.Api.Dtos;
using RiskGame.Rules.Results;

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
/// Nog geen groepen/privacy-grens (TO §6.1) en geen sessietokens (TO §6.3): deze plak
/// retourneert de bijgewerkte state alleen als RPC-resultaat aan de aanroeper. Dat volgt
/// in een latere plak.
/// </remarks>
public sealed class GameHub(
    LobbyCommandHandler lobbyCommands,
    OrderRollCommandHandler orderRollCommands,
    SetupCommandHandler setupCommands,
    ReinforceCommandHandler reinforceCommands,
    AttackCommandHandler attackCommands,
    TurnFlowCommandHandler turnFlowCommands) : Hub
{
    public async Task<JoinGameResponse> JoinGame(string gameId, string playerName)
    {
        var result = await lobbyCommands.JoinGameAsync(gameId, playerName);

        return Unwrap(result, joinResult => new JoinGameResponse(joinResult.PlayerId, joinResult.State));
    }

    public async Task<GameStateDto> ChooseColor(string gameId, string playerId, string colorId)
    {
        var result = await lobbyCommands.ChooseColorAsync(gameId, playerId, colorId);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> StartGame(string gameId, string playerId)
    {
        var result = await lobbyCommands.StartGameAsync(gameId, playerId);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> SelectRole(string gameId, string playerId, string roleId)
    {
        var result = await lobbyCommands.SelectRoleAsync(gameId, playerId, roleId);

        return Unwrap(result, state => state);
    }

    public async Task<OrderRollResponse> RollForOrder(string gameId, string playerId)
    {
        var result = await orderRollCommands.RollForOrderAsync(gameId, playerId);

        return Unwrap(result, rollResult => new OrderRollResponse(rollResult.Die1, rollResult.Die2, rollResult.State));
    }

    public async Task<GameStateDto> ClaimTerritory(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.ClaimTerritoryAsync(gameId, playerId, territoryId);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> PlaceInitialArmy(string gameId, string playerId, string territoryId)
    {
        var result = await setupCommands.PlaceInitialArmyAsync(gameId, playerId, territoryId);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> PlaceReinforcements(
        string gameId, string playerId, string territoryId, int amount)
    {
        var result = await reinforceCommands.PlaceReinforcementsAsync(gameId, playerId, territoryId, amount);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> TradeInCards(string gameId, string playerId, string[] cardIds)
    {
        var result = await reinforceCommands.TradeInCardsAsync(gameId, playerId, cardIds);

        return Unwrap(result, state => state);
    }

    public async Task<DeclareAttackResponse> DeclareAttack(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int attackDice)
    {
        var result = await attackCommands.DeclareAttackAsync(
            gameId, playerId, fromTerritoryId, toTerritoryId, attackDice);

        return Unwrap(result, declareResult =>
            new DeclareAttackResponse(declareResult.AttackerRolls, declareResult.State));
    }

    public async Task<CombatResultResponse> ChooseDefenseDice(string gameId, string playerId, int defenseDice)
    {
        var result = await attackCommands.ChooseDefenseDiceAsync(gameId, playerId, defenseDice);

        return Unwrap(result, combatResult => new CombatResultResponse(
            combatResult.AttackerRolls,
            combatResult.DefenderRolls,
            combatResult.AttackerLosses,
            combatResult.DefenderLosses,
            combatResult.Conquered,
            combatResult.State));
    }

    public async Task<GameStateDto> MoveAfterConquest(string gameId, string playerId, int armiesToMove)
    {
        var result = await attackCommands.MoveAfterConquestAsync(gameId, playerId, armiesToMove);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> Fortify(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int armiesToMove)
    {
        var result = await turnFlowCommands.FortifyAsync(gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> EndPhase(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndPhaseAsync(gameId, playerId);

        return Unwrap(result, state => state);
    }

    public async Task<GameStateDto> EndTurn(string gameId, string playerId)
    {
        var result = await turnFlowCommands.EndTurnAsync(gameId, playerId);

        return Unwrap(result, state => state);
    }

    private static TResponse Unwrap<T, TResponse>(Result<T> result, Func<T, TResponse> onSuccess) =>
        result.IsSuccess
            ? onSuccess(result.Value)
            : throw new HubException(string.Join(" | ", result.Errors));
}
