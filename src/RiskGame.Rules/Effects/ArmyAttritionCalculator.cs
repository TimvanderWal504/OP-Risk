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
    /// terug naar 1 leger.
    /// </summary>
    public static IReadOnlyDictionary<string, int> AutoMaxRemovals(GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return state.TerritoriesOf(playerId)
            .Where(territory => territory.ArmyCount > 1)
            .ToDictionary(territory => territory.TerritoryId, _ => 1);
    }

    /// <summary>
    /// Of een spelerkeuze geldig is: elk genoemd gebied is van de speler, geen gebied komt
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
                    $"Gebied '{territoryId}' is geen gebied van speler '{playerId}'.");
            }

            if (removed >= state.Territory(territoryId).ArmyCount)
            {
                return ValidationResult.Failure(
                    $"Gebied '{territoryId}' mag niet onder 1 leger komen.");
            }
        }

        var expected = Math.Min(amount, MaxRemovableArmies(state, playerId));
        var total = removalsByTerritory.Values.Sum();

        return total == expected
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                $"Er moeten in totaal {expected} legers verwijderd worden, niet {total}.");
    }
}
