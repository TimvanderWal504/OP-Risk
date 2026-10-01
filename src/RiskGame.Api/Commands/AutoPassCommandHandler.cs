using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;

namespace RiskGame.Api.Commands;

/// <summary>
/// Auto-pass (FO §11.1/§11.2, TO §4.1): een afwezige speler laat het spel nooit meer wachten.
/// </summary>
public sealed class AutoPassCommandHandler(IDocumentStore store, TimeProvider timeProvider)
{
    /// <summary>
    /// De speler is terug (FO §11.2): zijn telefoon verbond opnieuw met zijn eigen sessie. Staat hij
    /// in een lopend spel op auto-pass, dan vervalt dat; anders verandert er niets en is het
    /// resultaat <c>null</c>. Probeert het opnieuw bij een gelijktijdige append
    /// (<see cref="ConcurrencyRetry"/>) — een herverbinding valt vaak samen met andere acties.
    /// </summary>
    public Task<Result<GameStateDto?>> PlayerReturnedAsync(string gameId, string playerId) =>
        ConcurrencyRetry.RunAsync(() => TryPlayerReturnedAsync(gameId, playerId));

    private async Task<Result<GameStateDto?>> TryPlayerReturnedAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto?>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        if (state.Phase != GamePhase.InProgress || !state.HasPlayer(playerId) || !state.Player(playerId).IsAutoPass)
        {
            return Result<GameStateDto?>.Success(null);
        }

        session.Events.Append(gameId, new AutoPassDisabled(gameId, playerId));
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto?>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }
}
