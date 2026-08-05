using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Combat;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

public sealed record DeclareAttackResult(IReadOnlyList<int> AttackerRolls, Guid CorrelationId, GameStateDto State);

public sealed record ChooseDefenseDiceResult(
    IReadOnlyList<int> AttackerRolls,
    IReadOnlyList<int> DefenderRolls,
    int AttackerLosses,
    int DefenderLosses,
    bool Conquered,
    string AttackerId,
    string DefenderId,
    string FromTerritoryId,
    string ToTerritoryId,
    string? EliminatedPlayerId,
    Guid CorrelationId,
    GameStateDto State);

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>DeclareAttack</c>, <c>ChooseDefenseDice</c> en
/// <c>MoveAfterConquest</c> (FO §5.3). De rules-engine (<see cref="AttackGuards"/>,
/// <see cref="CombatResolver"/>, <see cref="ConquestResolution"/>) bestond al; deze
/// handler rijgt ze aan elkaar, net als <see cref="ReinforceCommandHandler"/> dat deed
/// voor Versterken.
/// </summary>
public sealed class AttackCommandHandler(IDocumentStore store, IRandomSource random, TimeProvider timeProvider)
{
    public async Task<Result<DeclareAttackResult>> DeclareAttackAsync(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int attackDice)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<DeclareAttackResult>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = ValidationResult.Combine(
            Guards.PlayerExists(state, playerId),
            AttackGuards.CanDeclareAttack(state, playerId, fromTerritoryId, toTerritoryId, attackDice));

        if (!validation.IsSuccess)
        {
            return Result<DeclareAttackResult>.Failure(validation.Errors);
        }

        var attackerRolls = CombatResolver.RollDice(attackDice, random);

        var now = timeProvider.GetUtcNow();
        var timer = state.TurnState!.Timer!;

        // FO §5.4 (herzien 2026-08-04): "een gevecht" is de hele belegering van één doelwit,
        // niet één worp. Blijft de aanvaller op hetzelfde gebiedspaar aanvallen, dan blijft de
        // timer over de herhaalde worpen heen bevroren (Tick() is toch al een no-op zolang
        // IsPaused waar is). Kiest de aanvaller een ánder doelwit terwijl de timer nog van de
        // vorige belegering bevroren staat, dan telt de tijd die hij nu aan het kiezen besteedt
        // weer mee — ResumeAndTick verrekent dat in één stap (zie doc-comment daar).
        var isSameTarget = state.TurnState.PausedAttackTarget is { } pausedTarget
            && pausedTarget.FromTerritoryId == fromTerritoryId
            && pausedTarget.ToTerritoryId == toTerritoryId;

        var remaining = timer.IsPaused && !isSameTarget
            ? timer.ResumeAndTick(now).Remaining
            : timer.Tick(now - timer.LastUpdatedUtc).Remaining;

        var correlationId = Guid.NewGuid();

        session.Events.Append(gameId, new DiceRolled(gameId, playerId, attackerRolls));
        session.Events.Append(
            gameId,
            new AttackDeclared(
                gameId, playerId, fromTerritoryId, toTerritoryId, attackDice, remaining, now, correlationId));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<DeclareAttackResult>.Success(new DeclareAttackResult(attackerRolls, correlationId, updatedDto));
    }

    public async Task<Result<ChooseDefenseDiceResult>> ChooseDefenseDiceAsync(
        string gameId, string playerId, int defenseDice)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<ChooseDefenseDiceResult>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttackGuards.CanChooseDefenseDice(state, playerId, defenseDice);

        if (!validation.IsSuccess)
        {
            return Result<ChooseDefenseDiceResult>.Failure(validation.Errors);
        }

        var pendingCombat = state.TurnState!.PendingCombat!;
        var attackerId = state.TurnState.ActivePlayerId;

        var rawEvents = await session.Events.FetchStreamAsync(gameId);
        var attackerRolls = rawEvents
            .Select(rawEvent => rawEvent.Data)
            .OfType<DiceRolled>()
            .Last(diceRolled => diceRolled.PlayerId == attackerId)
            .Rolls;

        var defenderRolls = CombatResolver.RollDice(defenseDice, random);
        session.Events.Append(gameId, new DiceRolled(gameId, playerId, defenderRolls));

        var outcome = CombatResolver.Compare(attackerRolls, defenderRolls);

        var fromArmyCount = state.Territory(pendingCombat.FromTerritoryId).ArmyCount;
        var toArmyCount = state.Territory(pendingCombat.ToTerritoryId).ArmyCount;
        var conquest = ConquestResolution.Apply(fromArmyCount, toArmyCount, outcome);

        // De timer hervat hier alleen als het gevecht meteen klaar is (geen verovering); bij
        // een verovering blijft hij gepauzeerd tot ArmiesMovedAfterConquest (FO §5.4).
        var resumedAtUtc = conquest.Conquered ? (DateTimeOffset?)null : timeProvider.GetUtcNow();

        session.Events.Append(gameId, new CombatResolved(
            gameId,
            attackerId,
            pendingCombat.FromTerritoryId,
            pendingCombat.ToTerritoryId,
            attackerRolls,
            defenderRolls,
            outcome.AttackerLosses,
            outcome.DefenderLosses,
            resumedAtUtc));

        string? eliminatedPlayerId = null;

        if (conquest.Conquered)
        {
            var defenderId = playerId;

            session.Events.Append(gameId, new TerritoryConquered(gameId, attackerId, pendingCombat.ToTerritoryId));

            if (state.TerritoriesOf(defenderId).Count() == 1)
            {
                session.Events.Append(gameId, new PlayerEliminated(gameId, defenderId, attackerId));
                eliminatedPlayerId = defenderId;
            }
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<ChooseDefenseDiceResult>.Success(new ChooseDefenseDiceResult(
            attackerRolls,
            defenderRolls,
            outcome.AttackerLosses,
            outcome.DefenderLosses,
            conquest.Conquered,
            attackerId,
            playerId,
            pendingCombat.FromTerritoryId,
            pendingCombat.ToTerritoryId,
            eliminatedPlayerId,
            pendingCombat.CorrelationId,
            updatedDto));
    }

    /// <summary>
    /// "Ander gevecht" (FO §5.4): de aanvaller stopt handmatig met de belegering van het
    /// huidige doelwit na een afgeslagen worp, zonder meteen een nieuw doelwit te kiezen. Zelfde
    /// <see cref="PhaseTimer.ResumeAndTick"/>-berekening als het wisselen van doelwit in
    /// <see cref="DeclareAttackAsync"/>, maar hier los van een nieuwe <c>AttackDeclared</c> —
    /// zonder dit event zou de timer op "Gepauzeerd" blijven staan tot de aanvaller alsnog een
    /// volgende aanval aankondigt of de fase beëindigt.
    /// </summary>
    public async Task<Result<GameStateDto>> AbandonAttackAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttackGuards.CanAbandonAttack(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        var now = timeProvider.GetUtcNow();
        var remaining = state.TurnState!.Timer!.ResumeAndTick(now).Remaining;

        session.Events.Append(gameId, new AttackAbandoned(gameId, playerId, remaining, now));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
    }

    public async Task<Result<GameStateDto>> MoveAfterConquestAsync(
        string gameId, string playerId, int armiesToMove)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var pendingCombat = state.TurnState?.PendingCombat;

        var validation = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Attack),
            pendingCombat is null
                ? ValidationResult.Failure("attack.noConquestToMoveInto")
                : AttackGuards.CanMoveAfterConquest(
                    state, playerId, pendingCombat.FromTerritoryId, pendingCombat.AttackDice, armiesToMove));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new ArmiesMovedAfterConquest(
            gameId,
            playerId,
            pendingCombat!.FromTerritoryId,
            pendingCombat.ToTerritoryId,
            armiesToMove,
            timeProvider.GetUtcNow()));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
    }
}
