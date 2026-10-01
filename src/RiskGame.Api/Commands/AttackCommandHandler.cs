using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.AutoPass;
using RiskGame.Rules.Combat;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Results;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <param name="AutoDefense">
/// Het al afgehandelde gevecht als de verdediger op auto-pass staat en er geen herwerp-keuze open
/// staat (FO §11.2); <c>null</c> als het gevecht nog op de verdediger wacht.
/// </param>
public sealed record DeclareAttackResult(
    IReadOnlyList<int> AttackerRolls, Guid CorrelationId, DefenseResolution? AutoDefense, GameStateDto State);

/// <param name="AutoDefense">Zie <see cref="DeclareAttackResult.AutoDefense"/>.</param>
public sealed record RerollAttackDieResult(
    IReadOnlyList<int> PreviousRolls,
    int RerolledDieIndex,
    int NewValue,
    IReadOnlyList<int> Rolls,
    Guid CorrelationId,
    DefenseResolution? AutoDefense,
    GameStateDto State);

/// <param name="AutoDefense">Zie <see cref="DeclareAttackResult.AutoDefense"/>.</param>
public sealed record KeepAttackDiceResult(DefenseResolution? AutoDefense, GameStateDto State);

public sealed record ChooseDefenseDiceResult(DefenseResolution Combat, GameStateDto State);

/// <summary>
/// Voert de TO §4-pijplijn uit voor <c>DeclareAttack</c>, <c>ChooseDefenseDice</c> en
/// <c>MoveAfterConquest</c> (FO §5.3). De rules-engine (<see cref="AttackGuards"/>,
/// <see cref="CombatResolver"/>, <see cref="ConquestResolution"/>) bestond al; deze
/// handler rijgt ze aan elkaar, net als <see cref="ReinforceCommandHandler"/> dat deed
/// voor Versterken. De verdediging zelf zit in <see cref="DefenseStep"/>. Staat de verdediger op
/// auto-pass (FO §11.2), dan verdedigt de server in hetzelfde commando dat het gevecht bij de
/// verdediger legt (<c>DeclareAttack</c>, of het sluiten van de herwerp-stap); staat de aanvaller op
/// auto-pass, dan maakt de keuze van de verdediger zijn afgebroken beurt af.
/// </summary>
public sealed class AttackCommandHandler(
    IDocumentStore store,
    IRandomSource random,
    TimeProvider timeProvider,
    GameProjection projection,
    DefenseStep defense,
    AutoPassResolver autoPass)
{
    public async Task<Result<DeclareAttackResult>> DeclareAttackAsync(
        string gameId, string playerId, string fromTerritoryId, string toTerritoryId, int attackDice)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadForWritingAsync(gameId);

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
        var declared = ProjectedAppend.Emit(
            session,
            state,
            new AttackDeclared(
                gameId, playerId, fromTerritoryId, toTerritoryId, attackDice,
                attackerRolls, awaitingRerollDecision, remaining, now, correlationId),
            projection.Apply);

        var autoDefense = defense.DefendIfAutoPass(session, declared)?.Combat;

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<DeclareAttackResult>.Success(
            new DeclareAttackResult(attackerRolls, correlationId, autoDefense, updatedDto));
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
        var state = await session.LoadForWritingAsync(gameId);

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

        var rerolled = ProjectedAppend.Emit(
            session,
            state,
            new AttackDieRerolled(
                gameId, playerId, pendingCombat.ToTerritoryId, previousRolls, dieIndex, newValue, rerollResult.Rolls),
            projection.Apply);

        var autoDefense = defense.DefendIfAutoPass(session, rerolled)?.Combat;

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<RerollAttackDieResult>.Success(new RerollAttackDieResult(
            previousRolls, dieIndex, newValue, rerollResult.Rolls, pendingCombat.CorrelationId, autoDefense, updatedDto));
    }

    /// <summary>
    /// "Doorgaan" (FO §5.3 stap 3, §8.1, plan-rollen A1/A8): de aanvaller sluit de herwerp-stap
    /// zonder te herwerpen. Verbruikt het beschikbare herwerp voor dit doelgebied niet — alleen
    /// het daadwerkelijk drukken op "Herwerp" doet dat (<see cref="RerollAttackDieAsync"/>).
    /// </summary>
    public async Task<Result<KeepAttackDiceResult>> KeepAttackDiceAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<KeepAttackDiceResult>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttackGuards.CanKeepAttackDice(state, playerId);

        if (!validation.IsSuccess)
        {
            return Result<KeepAttackDiceResult>.Failure(validation.Errors);
        }

        var kept = ProjectedAppend.Emit(
            session,
            state,
            new AttackDiceKept(gameId, playerId, state.TurnState!.PendingCombat!.ToTerritoryId),
            projection.Apply);

        var autoDefense = defense.DefendIfAutoPass(session, kept)?.Combat;

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<KeepAttackDiceResult>.Success(new KeepAttackDiceResult(autoDefense, updatedDto));
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
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<ChooseDefenseDiceResult>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var validation = AttackGuards.CanChooseDefenseDice(state, playerId, defenseDice, useDefenseBoost);

        if (!validation.IsSuccess)
        {
            return Result<ChooseDefenseDiceResult>.Failure(validation.Errors);
        }

        var defended = defense.Resolve(session, state, playerId, defenseDice);

        // Ging de aanvaller midden in dit gevecht op auto-pass, dan maakt de server nu zijn beurt af.
        var finished = autoPass.AfterCombat(session, defended.State);

        if (!finished.Result.IsSuccess)
        {
            return Result<ChooseDefenseDiceResult>.Failure(finished.Result.Errors);
        }

        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);
        var updatedDto = GameStateDtoMapper.ToDto(updated!, timeProvider);

        return Result<ChooseDefenseDiceResult>.Success(new ChooseDefenseDiceResult(defended.Combat, updatedDto));
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
        var state = await session.LoadForWritingAsync(gameId);

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
        var state = await session.LoadForWritingAsync(gameId);

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
