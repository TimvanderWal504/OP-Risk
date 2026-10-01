using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert <c>RemoveArmies</c> uit (FO §9.2, <c>ArmyAttrition</c>): een speler kiest van welke
/// gebieden hij legers afstaat, buiten de beurtvolgorde om en tegelijk met de andere wachtende
/// spelers. De laatste keuze start de beurt van de speler die al bij de trekking vastlag.
/// </summary>
public sealed class AttritionCommandHandler(
    IDocumentStore store, TimeProvider timeProvider, GameProjection projection, TurnAdvancer turnAdvancer)
{
    /// <summary>
    /// Kiezen twee spelers tegelijk als laatsten, dan wacht de tweede op de spel-lock
    /// (<see cref="GameWriteLock"/>) en beslist op de state ná de keuze van de ander: precies één
    /// van beide start de volgende beurt. <see cref="ConcurrencyRetry"/> blijft het vangnet voor een
    /// versieconflict dat toch optreedt.
    /// </summary>
    public Task<Result<GameStateDto>> RemoveArmiesAsync(
        string gameId, string playerId, IReadOnlyDictionary<string, int> removalsByTerritory) =>
        ConcurrencyRetry.RunAsync(() => TryRemoveArmiesAsync(gameId, playerId, removalsByTerritory));

    private async Task<Result<GameStateDto>> TryRemoveArmiesAsync(
        string gameId, string playerId, IReadOnlyDictionary<string, int> removalsByTerritory)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttritionGuards.CanRemoveArmies(state, playerId, removalsByTerritory);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        var removed = new ArmiesRemoved(gameId, playerId, removalsByTerritory);
        session.Events.Append(gameId, removed);

        var projected = projection.Apply(state, removed);

        if (projected.EventRound.PendingAttrition is null)
        {
            // De guard garandeert dat er een PendingAttrition was; zonder wachtenden is dit de laatste keuze.
            var started = turnAdvancer.StartTurn(session, projected, state.EventRound.PendingAttrition!.NextPlayerId);

            if (!started.IsSuccess)
            {
                return Result<GameStateDto>.Failure(started.Errors);
            }
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }
}
