using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Fortify;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>Fortify</c>, <c>EndPhase</c> en <c>EndTurn</c>
/// (FO §5.2, §5.5). De rules-engine (<see cref="FortifyGuards"/>, <see cref="TurnGuards"/>,
/// <see cref="TurnPhaseTransitions"/>) bestond al; deze handler rijgt ze aan elkaar, net als
/// <see cref="AttackCommandHandler"/> dat deed voor Aanvallen. <see cref="EndTurnAsync"/> trekt
/// het beurteinde via <see cref="TurnAdvancer"/>, dat ook de kaart na een veroverende beurt trekt
/// (FO §5.2), de missies controleert en de volgende beurt start.
/// </summary>
public sealed class TurnFlowCommandHandler(
    IDocumentStore store,
    TimeProvider timeProvider,
    TurnAdvancer turnAdvancer)
{
    public async Task<Result<GameStateDto>> FortifyAsync(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int armiesToMove)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = FortifyGuards.CanFortify(state, playerId, fromTerritoryId, toTerritoryId, armiesToMove);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new Fortified(gameId, playerId, fromTerritoryId, toTerritoryId, armiesToMove));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }

    public async Task<Result<GameStateDto>> EndPhaseAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = TurnGuards.CanEndPhase(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        var nextPhase = TurnPhaseTransitions.Next(state.TurnState!.TurnPhase);
        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(nextPhase, state.Settings, state.TurnState.Timer, now);

        // Binnen een beurt gaat het altijd Versterken → Aanvallen → Verplaatsen
        // (TurnPhaseTransitions.Next), dus hier wordt nooit een versterkingspool toegekend.
        session.Events.Append(
            gameId,
            new PhaseChanged(gameId, playerId, nextPhase, timer.Remaining, now, ArmiesGranted: null));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
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
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        if (state.TurnState is not { ActivePlayerId: var activePlayerId } turnState
            || activePlayerId != playerId
            || turnState.TurnPhase is not (TurnPhase.Reinforce or TurnPhase.Attack)
            || turnState.PendingCombat is not null
            || turnState.Timer is { IsPaused: true })
        {
            return Result<GameStateDto>.Failure(
                "turnFlow.cannotForceAdvance", new Dictionary<string, string> { ["playerId"] = playerId });
        }

        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(TurnPhase.Fortify, state.Settings, turnState.Timer, now);

        // FO §5.4 (besluit gebruiker 2026-09-16, taak 4b): een inleg van deze fase waarvan de
        // opbrengst niet volledig geplaatst is, draait terug in plaats van stilzwijgend te
        // vervallen — vanaf de laatste inleg, zolang de resterende pool 'm nog volledig
        // bevat (CardTradeReversal). Geldt voor zowel Versterken als Aanvallen (de guard
        // hierboven staat beide toe); wat er ná het terugdraaien van de pool overblijft
        // (incl. een eventuele basispool) vervalt gewoon — dat is geen apart event, alleen
        // afwezigheid van een event.
        foreach (var trade in CardTradeReversal.Resolve(turnState))
        {
            session.Events.Append(
                gameId,
                new CardTradeReverted(
                    gameId, playerId, trade.CardIds, trade.SetValue, trade.OwnedTerritoryBonuses, trade.PreviousTradeValue,
                    trade.PoolBonus));
        }

        // Naar Verplaatsen: geen versterkingspool, zie EndPhaseAsync.
        session.Events.Append(
            gameId,
            new PhaseChanged(gameId, playerId, TurnPhase.Fortify, timer.Remaining, now, ArmiesGranted: null));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
    }

    /// <summary>
    /// Beurteinde (FO §5.2), met op de rondegrens de gebeurtenisronde (FO §9.2). Probeert het
    /// opnieuw bij een gelijktijdige append (<see cref="ConcurrencyRetry"/>): de timer-service en
    /// de speler kunnen tegelijk de beurt beëindigen, en een tweede poging beslist dan op de state
    /// ná de eerste — en wordt geweigerd, zodat er nooit twee keer getrokken wordt.
    /// </summary>
    public Task<Result<GameStateDto>> EndTurnAsync(string gameId, string playerId) =>
        ConcurrencyRetry.RunAsync(() => TryEndTurnAsync(gameId, playerId));

    private async Task<Result<GameStateDto>> TryEndTurnAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = TurnGuards.CanEndTurn(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        // Kaart bij verovering, missiecontrole, laatste-kans-venster, gebeurtenisronde en de
        // volgende beurt (TO §5.2).
        var advanced = turnAdvancer.EndTurn(session, state, playerId);

        if (!advanced.IsSuccess)
        {
            return Result<GameStateDto>.Failure(advanced.Errors);
        }

        return await SaveAndMapAsync(session, gameId);
    }

    private async Task<Result<GameStateDto>> SaveAndMapAsync(IDocumentSession session, string gameId)
    {
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!, timeProvider));
    }
}
