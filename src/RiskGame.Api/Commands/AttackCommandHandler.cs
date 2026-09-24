using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Combat;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

public sealed record DeclareAttackResult(IReadOnlyList<int> AttackerRolls, Guid CorrelationId, GameStateDto State);

public sealed record RerollAttackDieResult(
    IReadOnlyList<int> PreviousRolls,
    int RerolledDieIndex,
    int NewValue,
    IReadOnlyList<int> Rolls,
    Guid CorrelationId,
    GameStateDto State);

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
    bool DefenseBoostUsed,
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
        // Plan-rollen C2: de commandhandler bepaalt dit via de guard, niet de vouwregel — die
        // blijft een domme feiten-toepasser en kopieert de vlag alleen naar PendingCombat.
        var awaitingRerollDecision = AttackGuards.RerollAvailable(state, playerId, toTerritoryId);

        session.Events.Append(gameId, new DiceRolled(gameId, playerId, attackerRolls));
        session.Events.Append(
            gameId,
            new AttackDeclared(
                gameId, playerId, fromTerritoryId, toTerritoryId, attackDice,
                attackerRolls, awaitingRerollDecision, remaining, now, correlationId));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<DeclareAttackResult>.Success(new DeclareAttackResult(attackerRolls, correlationId, updatedDto));
    }

    /// <summary>
    /// "Herwerp" (FO §5.3 stap 3, §8.1, plan-rollen A1/C5): de aanvaller herwerpt zelf één
    /// dobbelsteen van zijn eigen worp. Sluit de herwerp-stap voor dit doelgebied (C1) — een
    /// eventuele tweede, gelijktijdige beslissing (<see cref="KeepAttackDiceAsync"/>) vindt bij
    /// het vouwen een al gesloten stap en is een no-op (plan-rollen C8).
    /// </summary>
    public async Task<Result<RerollAttackDieResult>> RerollAttackDieAsync(
        string gameId, string playerId, int dieIndex)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<RerollAttackDieResult>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttackGuards.CanRerollAttackDie(state, playerId, dieIndex);

        if (!validation.IsSuccess)
        {
            return Result<RerollAttackDieResult>.Failure(validation.Errors);
        }

        var pendingCombat = state.TurnState!.PendingCombat!;
        var previousRolls = pendingCombat.AttackerRolls;
        var rerollResult = CombatResolver.RerollDie(previousRolls, dieIndex, random);
        var newValue = rerollResult.Rolls[rerollResult.NewDieIndex];

        session.Events.Append(gameId, new AttackDieRerolled(
            gameId, playerId, pendingCombat.ToTerritoryId, previousRolls, dieIndex, newValue, rerollResult.Rolls));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<RerollAttackDieResult>.Success(new RerollAttackDieResult(
            previousRolls, dieIndex, newValue, rerollResult.Rolls, pendingCombat.CorrelationId, updatedDto));
    }

    /// <summary>
    /// "Doorgaan" (FO §5.3 stap 3, §8.1, plan-rollen A1/A8): de aanvaller sluit de herwerp-stap
    /// zonder te herwerpen. Verbruikt het beschikbare herwerp voor dit doelgebied niet — alleen
    /// het daadwerkelijk drukken op "Herwerp" doet dat (<see cref="RerollAttackDieAsync"/>).
    /// </summary>
    public async Task<Result<GameStateDto>> KeepAttackDiceAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttackGuards.CanKeepAttackDice(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new AttackDiceKept(gameId, playerId, state.TurnState!.PendingCombat!.ToTerritoryId));

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<GameStateDto>.Success(updatedDto);
    }

    /// <param name="useDefenseBoost">
    /// De verdediger zet zijn <c>DefenseBoost</c>-rol in (FO §5.3 stap 4, §8.1). Wordt alleen
    /// verbruikt (<see cref="DefenseBoostUsed"/>-event) als de Huisregel de 2 dobbelstenen anders
    /// niet had toegestaan — in elke andere situatie is de vlag zonder effect.
    /// </param>
    public async Task<Result<ChooseDefenseDiceResult>> ChooseDefenseDiceAsync(
        string gameId, string playerId, int defenseDice, bool useDefenseBoost)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<ChooseDefenseDiceResult>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttackGuards.CanChooseDefenseDice(state, playerId, defenseDice, useDefenseBoost);

        if (!validation.IsSuccess)
        {
            return Result<ChooseDefenseDiceResult>.Failure(validation.Errors);
        }

        var defenseBoostUsed = AttackGuards.DefenseBoostRequired(state, defenseDice);

        if (defenseBoostUsed)
        {
            session.Events.Append(gameId, new DefenseBoostUsed(gameId, playerId));
        }

        var pendingCombat = state.TurnState!.PendingCombat!;
        var attackerId = state.TurnState.ActivePlayerId;
        // C5/C6: PendingCombat.AttackerRolls is leidend, niet de DiceRolled-audittrail — na een
        // herwerp staat daar nog de oorspronkelijke worp, PendingCombat is al bijgewerkt.
        var attackerRolls = pendingCombat.AttackerRolls;

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

                // FO §6.1: schakelt een ándere speler dan de missiehouder het doelwit van
                // diens EliminatePlayer-missie uit, dan vervalt die missie en komt de
                // missiehouder automatisch op de fallback-missie uit.
                var eliminatedColorId = state.Player(defenderId).ColorId!;
                var fallbacks = MissionAssignmentCalculator.ResolveFallbacksAfterElimination(
                    state.Players, state.Map.Missions, eliminatedColorId, attackerId, random);

                foreach (var (holderId, fallbackMissionId) in fallbacks)
                {
                    session.Events.Append(gameId, new MissionAssigned(gameId, holderId, fallbackMissionId));
                }

                // Werelddominantie kan alleen ontstaan door de laatste tegenstander uit te
                // schakelen. Lokaal voorspeld i.p.v. herladen: de enige eigendomswijziging in
                // deze methode is hierboven al bekend (het veroverde gebied), dus geen tweede
                // save/round-trip nodig om de al-gevouwen state te kunnen controleren.
                var predictedState = state.WithTerritory(
                    state.Territory(pendingCombat.ToTerritoryId) with { OwnerPlayerId = attackerId });

                if (WinConditionEvaluator.HasWorldDomination(predictedState, attackerId))
                {
                    session.Events.Append(gameId, new GameWon(gameId, [attackerId]));
                }
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
            defenseBoostUsed,
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
