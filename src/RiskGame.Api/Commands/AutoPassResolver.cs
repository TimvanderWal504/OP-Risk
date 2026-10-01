using Marten;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>Wat de server direct voor een speler op auto-pass afhandelde.</summary>
/// <param name="Combats">Gevechten die daarbij zijn uitgespeeld, voor de narratieve broadcast.</param>
/// <param name="Result">Faalt alleen als er na een beurteinde geen volgende speler is.</param>
public sealed record AutoPassResolution(IReadOnlyList<DefenseResolution> Combats, ValidationResult Result);

/// <summary>
/// Handelt meteen af wat er op een speler wacht die net op auto-pass ging (FO §11.2): zijn
/// verdediging, zijn legerverlies-keuze, of zijn eigen beurt. Gedeeld door <c>SetAutoPass</c> en de
/// host-uitval (TO §4.1), en door <c>ChooseDefenseDice</c> om de afgebroken beurt van een aanvaller op
/// auto-pass af te maken zodra zijn gevecht is uitgespeeld.
/// </summary>
/// <remarks>
/// Appendt alleen; opslaan doet de aanroeper. Elke stap rekent op de state zoals de projectie hem
/// dan ziet (<see cref="ProjectedAppend"/>).
/// </remarks>
public sealed class AutoPassResolver(
    DefenseStep defense, TurnAdvancer turnAdvancer, GameProjection projection, TimeProvider timeProvider)
{
    /// <summary>
    /// <paramref name="state"/> is de state direct na <c>AutoPassEnabled</c> voor
    /// <paramref name="playerId"/>. Er wacht hooguit één ding op hem: een speler is óf verdediger in
    /// het lopende gevecht, óf kiezer bij legerverlies (dan loopt er geen beurt), óf zelf aan de beurt.
    /// </summary>
    public AutoPassResolution ResolveWaiting(IDocumentSession session, GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        if (state.EventRound.PendingAttrition is { } attrition && attrition.AwaitingPlayerIds.Contains(playerId))
        {
            return ChooseAttrition(session, state, playerId, attrition);
        }

        if (state.TurnState is null)
        {
            return new AutoPassResolution([], ValidationResult.Success());
        }

        if (state.TurnState.ActivePlayerId == playerId)
        {
            return ContinueInterruptedTurn(session, state);
        }

        // Verdediger in het lopende gevecht (DefendIfAutoPass kijkt zelf of het gevecht bij hem ligt).
        if (defense.DefendIfAutoPass(session, state) is not { } defended)
        {
            return new AutoPassResolution([], ValidationResult.Success());
        }

        var after = AfterCombat(session, defended.State);

        return new AutoPassResolution([defended.Combat, .. after.Combats], after.Result);
    }

    /// <summary>
    /// Na een afgehandeld gevecht: stond de aanvaller intussen op auto-pass, dan wachtte zijn
    /// afgebroken beurt alleen nog op dit gevecht en maakt de server hem nu af (FO §11.2). De ene plek
    /// voor elk pad dat een gevecht afhandelt terwijl dat zo kan zijn — de eigen keuze van de
    /// verdediger (<c>ChooseDefenseDice</c>) en een verdediger die zelf net op auto-pass ging.
    /// </summary>
    public AutoPassResolution AfterCombat(IDocumentSession session, GameState state)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);

        return state is { Phase: GamePhase.InProgress, TurnState: { } turnState }
            && state.Player(turnState.ActivePlayerId).IsAutoPass
                ? ContinueInterruptedTurn(session, state)
                : new AutoPassResolution([], ValidationResult.Success());
    }

    /// <summary>
    /// Maakt de beurt af van een actieve speler die op auto-pass staat (FO §11.2). Een lopend gevecht
    /// wordt eerst uitgespeeld: een open herwerp-keuze wordt "Doorgaan", een verdediger op auto-pass
    /// verdedigt meteen, en na een verovering verhuist het minimum mee. Wacht het gevecht op een
    /// verdediger die zelf kiest, dan wacht het spel — die keuze maakt de beurt later af. Daarna
    /// hetzelfde als een verlopen timer (<see cref="CardTradeReversal"/>) en het beurteinde.
    /// </summary>
    public AutoPassResolution ContinueInterruptedTurn(IDocumentSession session, GameState state)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);

        var combats = new List<DefenseResolution>();

        while (state is { Phase: GamePhase.InProgress, TurnState.PendingCombat: { } pendingCombat })
        {
            var activePlayerId = state.TurnState.ActivePlayerId;

            if (pendingCombat.AwaitingRerollDecision)
            {
                state = ProjectedAppend.Emit(
                    session,
                    state,
                    new AttackDiceKept(state.GameId, activePlayerId, pendingCombat.ToTerritoryId),
                    projection.Apply);
                continue;
            }

            if (state.Territory(pendingCombat.ToTerritoryId).OwnerPlayerId == activePlayerId)
            {
                // Verovering die op de meeverplaatsing wacht: het minimum (FO §5.3 stap 6, §11.2).
                state = ProjectedAppend.Emit(
                    session,
                    state,
                    new ArmiesMovedAfterConquest(
                        state.GameId,
                        activePlayerId,
                        pendingCombat.FromTerritoryId,
                        pendingCombat.ToTerritoryId,
                        pendingCombat.AttackDice,
                        timeProvider.GetUtcNow()),
                    projection.Apply);
                continue;
            }

            if (defense.DefendIfAutoPass(session, state) is not { } defended)
            {
                // De verdediger kiest zelf; ChooseDefenseDice maakt de beurt daarna af.
                return new AutoPassResolution(combats, ValidationResult.Success());
            }

            combats.Add(defended.Combat);
            state = defended.State;
        }

        if (state.Phase != GamePhase.InProgress)
        {
            return new AutoPassResolution(combats, ValidationResult.Success());
        }

        var turnState = state.TurnState!;

        foreach (var trade in CardTradeReversal.Resolve(turnState))
        {
            state = ProjectedAppend.Emit(
                session,
                state,
                new CardTradeReverted(
                    state.GameId, turnState.ActivePlayerId, trade.CardIds, trade.SetValue, trade.OwnedTerritoryBonuses,
                    trade.PreviousTradeValue, trade.PoolBonus),
                projection.Apply);
        }

        var ended = turnAdvancer.EndInterruptedTurn(session, state, turnState.ActivePlayerId);

        return new AutoPassResolution(combats, ended);
    }

    /// <summary>
    /// De legerverlies-keuze voor een speler op auto-pass (FO §9.2/§11.2). Was hij de laatste op de
    /// wachtlijst, dan start de beurt van de speler die al bij de trekking vastlag.
    /// </summary>
    private AutoPassResolution ChooseAttrition(
        IDocumentSession session, GameState state, string playerId, PendingAttrition attrition)
    {
        var removals = ArmyAttritionCalculator.AutoPassRemovals(state, playerId, attrition.Amount);
        state = ProjectedAppend.Emit(
            session, state, new ArmiesRemoved(state.GameId, playerId, removals), projection.Apply);

        if (state.EventRound.PendingAttrition is not null)
        {
            return new AutoPassResolution([], ValidationResult.Success());
        }

        var started = turnAdvancer.StartTurn(session, state, attrition.NextPlayerId);

        return new AutoPassResolution([], started);
    }
}
