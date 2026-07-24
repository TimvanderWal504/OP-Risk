using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Fortify;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>Fortify</c>, <c>EndPhase</c> en <c>EndTurn</c>
/// (FO §5.2, §5.5). De rules-engine (<see cref="FortifyGuards"/>, <see cref="TurnGuards"/>,
/// <see cref="TurnPhaseTransitions"/>, <see cref="TurnOrderCalculator"/>) bestond al; deze
/// handler rijgt ze aan elkaar, net als <see cref="AttackCommandHandler"/> dat deed voor
/// Aanvallen. Kaart trekken bij verovering en missie-/wincheck horen niet bij deze plak
/// (TO §11, latere bouwstap).
/// </summary>
public sealed class TurnFlowCommandHandler(IDocumentStore store, TimeProvider timeProvider)
{
    public async Task<Result<GameStateDto>> FortifyAsync(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int armiesToMove)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = FortifyGuards.CanFortify(state, playerId, fromTerritoryId, toTerritoryId, armiesToMove);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new Fortified(gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }

    public async Task<Result<GameStateDto>> EndPhaseAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = TurnGuards.CanEndPhase(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        var nextPhase = TurnPhaseTransitions.Next(state.TurnState!.TurnPhase);
        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(nextPhase, state.Settings, state.TurnState.Timer, now);

        session.Events.Append(gameId, new PhaseChanged(gameId, playerId, nextPhase, timer.Remaining, now));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }

    /// <summary>
    /// Forceert de overstap naar Verplaatsen zodra de gedeelde Versterken/Aanvallen-timer
    /// afloopt (FO §5.4) — vanuit zowel Versterken als Aanvallen rechtstreeks naar
    /// Verplaatsen, in tegenstelling tot <see cref="EndPhaseAsync"/> dat via Versterken
    /// altijd eerst naar Aanvallen stapt. Geen speler-commando: wordt alleen aangeroepen
    /// door <see cref="TurnTimerBackgroundService"/>, dus geen <c>IsActivePlayer</c>-guard
    /// nodig — <paramref name="playerId"/> is al de bekende actieve speler.
    /// </summary>
    public async Task<Result<GameStateDto>> ForceAdvanceToFortifyAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        if (state.TurnState is not { ActivePlayerId: var activePlayerId } turnState
            || activePlayerId != playerId
            || turnState.TurnPhase is not (TurnPhase.Reinforce or TurnPhase.Attack)
            || turnState.PendingCombat is not null)
        {
            return Result<GameStateDto>.Failure(
                $"Kan de Versterken/Aanvallen-timer niet forceren voor speler '{playerId}': " +
                "de beurt staat niet meer in de verwachte fase.");
        }

        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(TurnPhase.Fortify, state.Settings, turnState.Timer, now);

        session.Events.Append(gameId, new PhaseChanged(gameId, playerId, TurnPhase.Fortify, timer.Remaining, now));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }

    public async Task<Result<GameStateDto>> EndTurnAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = TurnGuards.CanEndTurn(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        var nextPlayerId = TurnOrderCalculator.NextActivePlayerId(state);

        if (nextPlayerId is null)
        {
            return Result<GameStateDto>.Failure(
                "Kan de beurt niet doorschuiven: geen andere actieve speler gevonden.");
        }

        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(TurnPhase.Reinforce, state.Settings, currentTimer: null, now);

        session.Events.Append(gameId, new TurnEnded(gameId, playerId));
        session.Events.Append(
            gameId, new PhaseChanged(gameId, nextPlayerId, TurnPhase.Reinforce, timer.Remaining, now));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }
}
