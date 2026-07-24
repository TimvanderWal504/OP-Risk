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
public sealed class TurnFlowCommandHandler(IDocumentStore store)
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

        session.Events.Append(gameId, new PhaseChanged(gameId, playerId, nextPhase));

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

        session.Events.Append(gameId, new TurnEnded(gameId, playerId));
        session.Events.Append(gameId, new PhaseChanged(gameId, nextPlayerId, TurnPhase.Reinforce));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }
}
