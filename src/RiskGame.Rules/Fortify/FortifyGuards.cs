using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
using RiskGame.Rules.Roles;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Fortify;

/// <summary>
/// Regelvalidatie voor de verplaatsingsfase (FO §5.2): mag deze <c>Fortify</c> op deze
/// state, ja of nee. Puur validatie, geen state-mutatie — het daadwerkelijk verplaatsen
/// van legers hoort bij de command-orchestratie in een latere bouwstap (TO §11, stap 3),
/// net als bij <see cref="Combat.AttackGuards"/> en <see cref="Reinforcement.ReinforceGuards"/>.
/// </summary>
public static class FortifyGuards
{
    public static ValidationResult CanFortify(
        GameState state,
        string playerId,
        string fromTerritoryId,
        string toTerritoryId,
        int armiesToMove)
    {
        var preconditions = ValidationResult.Combine(
            Guards.IsActivePlayer(state, playerId),
            Guards.IsInTurnPhase(state, TurnPhase.Fortify),
            Guards.OwnsTerritory(state, playerId, fromTerritoryId),
            Guards.OwnsTerritory(state, playerId, toTerritoryId));

        if (!preconditions.IsSuccess)
        {
            return preconditions;
        }

        if (state.TurnState!.HasFortified)
        {
            return ValidationResult.Failure("fortify.alreadyMoved");
        }

        if (fromTerritoryId == toTerritoryId)
        {
            return ValidationResult.Failure("fortify.sourceAndTargetMustDiffer");
        }

        var fromArmyCount = state.Territory(fromTerritoryId).ArmyCount;

        var checks = new List<ValidationResult>
        {
            armiesToMove >= 1
                ? ValidationResult.Success()
                : ValidationResult.Failure("fortify.mustMoveAtLeastOneArmy"),

            armiesToMove <= fromArmyCount - 1
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "fortify.mustLeaveOneArmyBehind",
                    new Dictionary<string, string>
                    {
                        ["territoryId"] = fromTerritoryId,
                        ["available"] = fromArmyCount.ToString(),
                        ["requested"] = armiesToMove.ToString(),
                    }),

            IsTerritoryLocked(state, fromTerritoryId)
                ? ValidationResult.Failure("fortify.territoryLocked", new Dictionary<string, string> { ["territoryId"] = fromTerritoryId })
                : ValidationResult.Success(),

            IsTerritoryLocked(state, toTerritoryId)
                ? ValidationResult.Failure("fortify.territoryLocked", new Dictionary<string, string> { ["territoryId"] = toTerritoryId })
                : ValidationResult.Success(),

            HasFortifyPath(state, playerId, fromTerritoryId, toTerritoryId)
                ? ValidationResult.Success()
                : ValidationResult.Failure(
                    "fortify.noPathBetweenTerritories",
                    new Dictionary<string, string> { ["fromTerritoryId"] = fromTerritoryId, ["toTerritoryId"] = toTerritoryId }),
        };

        return ValidationResult.Combine([.. checks]);
    }

    private static bool HasFortifyPath(
        GameState state, string playerId, string fromTerritoryId, string toTerritoryId) =>
        ReachableSet(state, playerId, fromTerritoryId, MaxEnemyPasses(state, playerId), BuildBlockedBorderPredicate(state))
            .Contains(toTerritoryId);

    /// <summary>
    /// Verdeelt de eigen (niet-<see cref="ITerritoryLockingEffect"/>-vergrendelde) gebieden van
    /// <paramref name="playerId"/> in samenhangende groepen: binnen een groep is elk gebied vanuit
    /// elk ander gebied bereikbaar via een geldig Fortify-pad (FO §5.2). Bereikbaarheid is
    /// symmetrisch (grenzen zijn ongericht, het <c>FortifyUpgrade</c>/<c>throughEnemy</c>-budget
    /// kost evenveel in beide richtingen), dus "bereikbaar vanuit X" is simpelweg "de rest van X's
    /// groep" — geen aparte berekening per bron nodig (zie <see cref="ReachableSet"/>).
    /// </summary>
    public static IReadOnlyList<IReadOnlyList<string>> ReachableComponents(GameState state, string playerId)
    {
        var maxEnemyPasses = MaxEnemyPasses(state, playerId);
        var isBorderBlocked = BuildBlockedBorderPredicate(state);

        var ownTerritoryIds = state.Territories
            .Where(territory => territory.OwnerPlayerId == playerId && !IsTerritoryLocked(state, territory.TerritoryId))
            .Select(territory => territory.TerritoryId);

        var visited = new HashSet<string>();
        var components = new List<IReadOnlyList<string>>();

        foreach (var territoryId in ownTerritoryIds)
        {
            if (!visited.Add(territoryId))
            {
                continue;
            }

            // Alleen het lidmaatschap van de groep wordt hier op locked gefilterd: HasFortifyPath
            // (via dezelfde ReachableSet) mag locked tussengebieden nog gewoon passeren, exact
            // zoals vóór deze toevoeging — alleen de eind-/brongebieden worden apart getoetst
            // (CanFortify's IsTerritoryLocked-checks hierboven). Zonder dit filter zou een locked
            // gebied dat toevallig bereikbaar is wél als geldig doel getoond worden.
            var component = ReachableSet(state, playerId, territoryId, maxEnemyPasses, isBorderBlocked)
                .Where(id => !IsTerritoryLocked(state, id))
                .ToList();
            component.Add(territoryId);
            visited.UnionWith(component);
            components.Add(component);
        }

        return components;
    }

    private static int MaxEnemyPasses(GameState state, string playerId) =>
        RoleEffects.Active<FortifyUpgradeEffect>(state, playerId) is { ThroughEnemy: true } ? 1 : 0;

    /// <summary>
    /// BFS met een budget van maximaal <paramref name="maxEnemyPasses"/> niet-eigen
    /// tussengebieden op het pad (FO §8: `FortifyUpgrade`/`throughEnemy`). Kan niet via de
    /// generieke <see cref="AdjacencyGraph.HasPath"/>: die kent alleen "traversable ja/nee"
    /// per gebied, geen budget dat per pad kan opraken, dus de bezoek-status hier is
    /// (gebied, resterend budget) in plaats van alleen het gebied. Geeft alle vanuit
    /// <paramref name="from"/> bereikbare eigen gebieden terug, exclusief <paramref name="from"/>
    /// zelf — gedeeld door zowel het ja/nee-pad-onderzoek (<see cref="HasFortifyPath"/>) als de
    /// groepsindeling (<see cref="ReachableComponents"/>). Filtert zelf niet op
    /// <c>TerritoryLocked</c>: een locked gebied mag nog steeds als tussenstap gepasseerd worden
    /// (alleen bron/doel worden apart getoetst, zie <see cref="CanFortify"/>'s eigen checks) — de
    /// endpoint-filtering voor <see cref="ReachableComponents"/> gebeurt daar zelf.
    /// </summary>
    private static HashSet<string> ReachableSet(
        GameState state,
        string playerId,
        string from,
        int maxEnemyPasses,
        Func<Border, bool>? isBorderBlocked)
    {
        var reachable = new HashSet<string>();
        var visited = new HashSet<(string TerritoryId, int BudgetUsed)>();
        var start = (TerritoryId: from, BudgetUsed: 0);
        visited.Add(start);

        var queue = new Queue<(string TerritoryId, int BudgetUsed)>();
        queue.Enqueue(start);

        while (queue.Count > 0)
        {
            var (currentId, budgetUsed) = queue.Dequeue();

            foreach (var border in state.Map.Adjacency.Borders(currentId))
            {
                if (isBorderBlocked?.Invoke(border) == true)
                {
                    continue;
                }

                var neighbourId = border.From == currentId ? border.To : border.From;
                var isOwnTerritory = state.Territory(neighbourId).OwnerPlayerId == playerId;
                var neighbourBudgetUsed = isOwnTerritory ? budgetUsed : budgetUsed + 1;

                if (neighbourBudgetUsed > maxEnemyPasses || !visited.Add((neighbourId, neighbourBudgetUsed)))
                {
                    continue;
                }

                // Een lus terug naar `from` zelf (via een niet-eigen tussengebied, dus met een
                // ander budget dan de start) mag niet als "bereikbaar vanuit zichzelf" tellen —
                // anders duikt `from` op in zijn eigen resultaat zodra er een niet-eigen gebied
                // tussen twee grenzen van hetzelfde gebied ligt.
                if (isOwnTerritory && neighbourId != from)
                {
                    reachable.Add(neighbourId);
                }

                queue.Enqueue((neighbourId, neighbourBudgetUsed));
            }
        }

        return reachable;
    }

    /// <summary>
    /// Of een actief effect (FO §9.2: <c>TerritoryLocked</c>) <paramref name="territoryId"/>
    /// deze ronde afsluit — dus ook geen Verplaatsen erin of eruit.
    /// </summary>
    private static bool IsTerritoryLocked(GameState state, string territoryId) =>
        state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<ITerritoryLockingEffect>()
            .Any(locking => locking.IsLocked(territoryId));

    private static Func<Border, bool>? BuildBlockedBorderPredicate(GameState state)
    {
        var blockers = state.ActiveEffects
            .Select(active => active.Effect)
            .OfType<ISeaRouteBlockingEffect>()
            .ToArray();

        return blockers.Length == 0
            ? null
            : border => blockers.Any(blocker => blocker.IsRouteBlocked(border));
    }
}
