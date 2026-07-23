using RiskGame.Rules.State;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// Wie er aan zet is tijdens <see cref="GamePhase.Claiming"/>/<see cref="GamePhase.InitialPlacement"/>
/// (FO §5.1). <see cref="GameState.TurnState"/> is in deze fases nog <c>null</c> (zie de
/// doc-comment daarop): wie aan zet is wordt hier afgeleid uit <see cref="GameState.TurnOrder"/>
/// plus voortgang, in plaats van apart bijgehouden — puur rekenwerk, geen state-mutatie,
/// zelfde pijler als <see cref="TurnOrderCalculator"/>.
/// </summary>
public static class SetupTurnCalculator
{
    /// <summary>
    /// Claimen is een simpele ronde: iedereen claimt precies op zijn beurt totdat de
    /// gebiedenpool leeg is (geen speler valt eerder af dan een ander).
    /// </summary>
    public static string ActiveClaimerId(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        var claimedCount = state.Territories.Count(territory => territory.OwnerPlayerId is not null);

        return state.TurnOrder[claimedCount % state.TurnOrder.Count];
    }

    /// <summary>
    /// Bijplaatsen is lastiger dan claimen: spelers kunnen tijdens Claiming een ongelijk
    /// aantal gebieden (en dus een ongelijk legerbudget) hebben gekregen, en vallen dus op
    /// verschillende momenten af. Het wie-wanneer-klaar-patroon ligt volledig vast zodra de
    /// legerbudgetten aan het begin van deze fase bekend zijn, dus simuleert deze functie de
    /// ronde vanaf het begin om te bepalen wiens beurt de
    /// eerstvolgende plaatsing is. <c>null</c> zodra niemand nog legers over heeft
    /// (Bijplaatsen is klaar).
    /// </summary>
    public static string? ActivePlacerId(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        var budgets = state.TurnOrder.ToDictionary(
            playerId => playerId,
            playerId => state.Settings.StartingArmies - state.TerritoriesOf(playerId).Sum(t => t.ArmyCount));

        if (budgets.Values.All(remaining => remaining == 0))
        {
            return null;
        }

        // De budgetten aan het begin van InitialPlacement (vóór enige plaatsing) volgen uit
        // het aantal geclaimde gebieden; het huidige restant ligt al in `budgets`. Het aantal
        // al gezette stappen is het verschil tussen beginbudget en huidig restant, samen over
        // alle spelers.
        var initialBudgets = state.TurnOrder.ToDictionary(
            playerId => playerId,
            playerId => state.Settings.StartingArmies - state.TerritoriesOf(playerId).Count());

        var stepsSoFar = state.TurnOrder.Sum(playerId => initialBudgets[playerId] - budgets[playerId]);

        var remainingBudgets = new Dictionary<string, int>(initialBudgets);
        var index = 0;

        for (var step = 0; step < stepsSoFar; step++)
        {
            index = NextIndexWithBudget(state.TurnOrder, remainingBudgets, index);
            remainingBudgets[state.TurnOrder[index]]--;
            index = (index + 1) % state.TurnOrder.Count;
        }

        index = NextIndexWithBudget(state.TurnOrder, remainingBudgets, index);

        return state.TurnOrder[index];
    }

    private static int NextIndexWithBudget(
        IReadOnlyList<string> turnOrder, IReadOnlyDictionary<string, int> remainingBudgets, int startIndex)
    {
        var index = startIndex;

        for (var i = 0; i < turnOrder.Count; i++)
        {
            if (remainingBudgets[turnOrder[index]] > 0)
            {
                return index;
            }

            index = (index + 1) % turnOrder.Count;
        }

        throw new InvalidOperationException(
            "Geen enkele speler heeft nog legerbudget over; had eerst op null-check moeten stoppen.");
    }
}
