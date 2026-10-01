using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Effects;

/// <summary>
/// De vragen die de guards aan de lopende gebeurtenis-effecten stellen (FO §9.2): is een gebied
/// afgesloten, is een grens geblokkeerd? Op één plek, zodat Aanvallen, Verplaatsen en de
/// weergave dezelfde uitkomst zien. Kent alleen de capability-interfaces, geen concrete effecten.
/// </summary>
public static class ActiveEffectQueries
{
    /// <summary>Of een actief <see cref="ITerritoryLockingEffect"/> <paramref name="territoryId"/> deze ronde afsluit.</summary>
    public static bool IsTerritoryLocked(GameState state, string territoryId)
    {
        ArgumentNullException.ThrowIfNull(state);

        return state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<ITerritoryLockingEffect>()
            .Any(locking => locking.IsLocked(territoryId));
    }

    /// <summary>De kaart die deze ronde gebieden afsluit, of <c>null</c> als er geen is.</summary>
    public static string? LockingEffectId(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        return state.ActiveEffects
            .Select(active => active.Effect)
            .FirstOrDefault(effect => effect is ITerritoryLockingEffect)
            ?.Id;
    }

    /// <summary>
    /// Of de grens tussen <paramref name="fromTerritoryId"/> en <paramref name="toTerritoryId"/>
    /// door een actief <see cref="ISeaRouteBlockingEffect"/> geblokkeerd is. Geen grens tussen
    /// beide gebieden betekent: niets om te blokkeren.
    /// </summary>
    public static bool IsBorderBlocked(GameState state, string fromTerritoryId, string toTerritoryId)
    {
        ArgumentNullException.ThrowIfNull(state);

        var border = state.Map.Adjacency.Borders(fromTerritoryId)
            .FirstOrDefault(border =>
                (border.From == fromTerritoryId && border.To == toTerritoryId) ||
                (border.From == toTerritoryId && border.To == fromTerritoryId));

        return border is not null && BlockedBorderPredicate(state)?.Invoke(border) == true;
    }

    /// <summary>
    /// Een predicaat voor een padzoektocht (<see cref="AdjacencyGraph"/>): <c>null</c> als er
    /// geen blokkerend effect loopt, zodat de zoektocht dan niets extra's hoeft te doen.
    /// </summary>
    public static Func<Border, bool>? BlockedBorderPredicate(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        var blockers = state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<ISeaRouteBlockingEffect>()
            .ToArray();

        return blockers.Length == 0
            ? null
            : border => blockers.Any(blocker => blocker.IsRouteBlocked(border));
    }
}
