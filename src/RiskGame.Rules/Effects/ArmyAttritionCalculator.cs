using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Effects;

/// <summary>
/// Pure berekeningen voor het <c>ArmyAttrition</c>-gebeurteniseffect (FO §9.2): elke speler
/// met keuzevrijheid verwijdert zelf <c>amount</c> eigen legers, verdeeld over eigen
/// gebieden, nooit onder 1 leger per gebied. Geen state-mutatie en geen orchestratie van de
/// gelijktijdige-keuze-interactie (buiten spelvolgorde, alle getroffen spelers tegelijk) —
/// dat hoort bij een latere bouwstap, net als bij <see cref="Combat.AttackGuards"/> en
/// <see cref="Reinforcement.ReinforceGuards"/>.
/// </summary>
public static class ArmyAttritionCalculator
{
    /// <summary>Het totaal aantal legers dat <paramref name="playerId"/> maximaal kan afstaan.</summary>
    public static int MaxRemovableArmies(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return state.TerritoriesOf(playerId).Sum(territory => territory.ArmyCount - 1);
    }

    /// <summary>
    /// Of <paramref name="playerId"/> een echte keuze heeft bij het verwijderen van
    /// <paramref name="amount"/> legers, of toch al op het automatische maximum uitkomt
    /// (FO §9.2: alleen spelers met keuzevrijheid krijgen het "Legers verwijderen"-scherm).
    /// </summary>
    public static bool HasChoice(GameState state, string playerId, int amount) =>
        MaxRemovableArmies(state, playerId) >= amount;

    /// <summary>
    /// Het automatische pad voor een speler zonder keuzevrijheid: elk gebied van de speler
    /// terug naar 1 leger. Levert per gebied het aantal áfgestane legers (zelfde betekenis als
    /// bij <see cref="CanApply"/>), niet het aantal dat overblijft.
    /// </summary>
    public static IReadOnlyDictionary<string, int> AutoMaxRemovals(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return state.TerritoriesOf(playerId)
            .Where(territory => territory.ArmyCount > 1)
            .ToDictionary(territory => territory.TerritoryId, territory => territory.ArmyCount - 1);
    }

    /// <summary>
    /// De keuze die de server maakt voor een speler op auto-pass (FO §9.2/§11.2): telkens 1 leger
    /// van het gebied met de meeste legers (bij gelijkstand het eerste in de volgorde van de
    /// kaartdata), nooit onder 1, tot <paramref name="amount"/> bereikt is. Kan de speler minder
    /// missen, dan is dit gelijk aan <see cref="AutoMaxRemovals"/>. Zelfde vorm als
    /// <see cref="AutoMaxRemovals"/>: per gebied het aantal áfgestane legers; gebieden die niets
    /// afstaan ontbreken.
    /// </summary>
    public static IReadOnlyDictionary<string, int> AutoPassRemovals(GameState state, string playerId, int amount)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);
        ArgumentOutOfRangeException.ThrowIfNegative(amount);

        if (!HasChoice(state, playerId, amount))
        {
            return AutoMaxRemovals(state, playerId);
        }

        var owned = state.Map.Territories
            .Select(territory => state.Territory(territory.Id))
            .Where(territory => territory.OwnerPlayerId == playerId)
            .ToArray();
        var armies = owned.Select(territory => territory.ArmyCount).ToArray();
        var removals = new Dictionary<string, int>();

        for (var removed = 0; removed < amount; removed++)
        {
            // Strikt groter: bij gelijkstand blijft het eerste gebied in de kaartdata staan.
            var largest = 0;

            for (var index = 1; index < armies.Length; index++)
            {
                if (armies[index] > armies[largest])
                {
                    largest = index;
                }
            }

            armies[largest]--;
            removals[owned[largest].TerritoryId] = removals.GetValueOrDefault(owned[largest].TerritoryId) + 1;
        }

        return removals;
    }

    /// <summary>
    /// Of een spelerkeuze geldig is: elk genoemd gebied is van de speler en staat een positief
    /// aantal af, geen gebied komt
    /// onder 1 leger, en de som van de verwijderingen komt exact overeen met wat er
    /// afgestaan moet worden (<paramref name="amount"/>, of het maximum als dat lager ligt).
    /// </summary>
    public static ValidationResult CanApply(
        GameState state, string playerId, IReadOnlyDictionary<string, int> removalsByTerritory, int amount)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);
        ArgumentNullException.ThrowIfNull(removalsByTerritory);

        foreach (var (territoryId, removed) in removalsByTerritory)
        {
            if (!state.HasTerritory(territoryId) || state.Territory(territoryId).OwnerPlayerId != playerId)
            {
                return ValidationResult.Failure(
                    "common.territoryNotOwned",
                    new Dictionary<string, string> { ["territoryId"] = territoryId, ["playerId"] = playerId });
            }

            // Een nul of negatief aantal zou een tekort elders kunnen "compenseren" in de som.
            if (removed <= 0)
            {
                return ValidationResult.Failure(
                    "attrition.removalMustBePositive", new Dictionary<string, string> { ["territoryId"] = territoryId });
            }

            if (removed >= state.Territory(territoryId).ArmyCount)
            {
                return ValidationResult.Failure(
                    "attrition.territoryMustKeepOneArmy", new Dictionary<string, string> { ["territoryId"] = territoryId });
            }
        }

        var expected = Math.Min(amount, MaxRemovableArmies(state, playerId));
        var total = removalsByTerritory.Values.Sum();

        return total == expected
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "attrition.wrongTotalRemoved",
                new Dictionary<string, string> { ["expected"] = expected.ToString(), ["actual"] = total.ToString() });
    }
}
