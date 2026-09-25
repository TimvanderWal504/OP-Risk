namespace RiskGame.Rules.State;

/// <summary>
/// Houdt het verloop bij (<see cref="GameState.RecentActions"/>, nieuwste eerst): puur en
/// deterministisch, zodat de projectie alleen nog aanroept en de samenvoegregels los te testen zijn.
/// </summary>
public static class RecentActionLog
{
    /// <summary>Zoveel regels houdt het verloop vast (plan-testronde-tv punt 4: "de laatste 10").</summary>
    public const int MaxEntries = 10;

    /// <summary>
    /// Voegt <paramref name="action"/> toe. Heeft de bovenste regel dezelfde sleutel (zie
    /// <see cref="CanMerge"/>), dan werkt die regel bij en blijft zijn <see cref="RecentAction.Sequence"/>
    /// gelijk; anders komt de actie vooraan met het volgende volgnummer en valt de oudste regel
    /// boven <see cref="MaxEntries"/> weg. De <c>Sequence</c> van <paramref name="action"/> zelf
    /// wordt genegeerd.
    /// </summary>
    public static IReadOnlyList<RecentAction> Append(IReadOnlyList<RecentAction> log, RecentAction action)
    {
        ArgumentNullException.ThrowIfNull(log);
        ArgumentNullException.ThrowIfNull(action);

        if (log.Count > 0 && CanMerge(log[0], action))
        {
            return [Merge(log[0], action), .. log.Skip(1)];
        }

        var next = action with { Sequence = log.Count > 0 ? log[0].Sequence + 1 : 1 };

        return [next, .. log.Take(MaxEntries - 1)];
    }

    /// <summary>
    /// Werkt de meest recente regel bij die aan <paramref name="matches"/> voldoet, op zijn eigen
    /// plek en met zijn eigen volgnummer — voor een actie die bij een eerdere regel hoort maar
    /// niet per se bij de bovenste (een meeverplaatsing na een verovering die een uitschakeling
    /// opleverde). Geen passende regel is geen fout: het verloop kan ingekort zijn, of het spel
    /// liep al vóór er een verloop bestond; dan blijft het log ongewijzigd.
    /// </summary>
    public static IReadOnlyList<RecentAction> Update(
        IReadOnlyList<RecentAction> log, Func<RecentAction, bool> matches, Func<RecentAction, RecentAction> change)
    {
        ArgumentNullException.ThrowIfNull(log);
        ArgumentNullException.ThrowIfNull(matches);
        ArgumentNullException.ThrowIfNull(change);

        for (var i = 0; i < log.Count; i++)
        {
            if (matches(log[i]))
            {
                var copy = log.ToArray();
                copy[i] = change(log[i]) with { Sequence = log[i].Sequence };

                return copy;
            }
        }

        return log;
    }

    /// <summary>
    /// De samenvoegregels: de willekeurige verdeling is één regel; opeenvolgende plaatsingen van
    /// dezelfde speler op hetzelfde gebied zijn één regel; opeenvolgende worpen van dezelfde
    /// aanvaller van en naar dezelfde gebieden zijn één belegering. Omdat alleen met de bovenste
    /// regel wordt samengevoegd, breekt elke tussenliggende regel — ook de
    /// <see cref="RecentActionKind.ReinforcementsGranted"/> aan het begin van elke beurt — de reeks.
    /// </summary>
    private static bool CanMerge(RecentAction head, RecentAction action) =>
        head.Kind == action.Kind
        && action.Kind switch
        {
            RecentActionKind.TerritoriesDealt => true,
            RecentActionKind.ArmiesPlaced =>
                head.PlayerId == action.PlayerId && head.TerritoryId == action.TerritoryId,
            RecentActionKind.Attack =>
                head.PlayerId == action.PlayerId
                && head.FromTerritoryId == action.FromTerritoryId
                && head.TerritoryId == action.TerritoryId,
            _ => false,
        };

    private static RecentAction Merge(RecentAction head, RecentAction action) =>
        action.Kind switch
        {
            RecentActionKind.ArmiesPlaced => head with
            {
                Amount = head.Amount + action.Amount,
                Total = action.Total,
            },
            RecentActionKind.Attack => head with
            {
                AttackerLosses = head.AttackerLosses + action.AttackerLosses,
                DefenderLosses = head.DefenderLosses + action.DefenderLosses,
            },
            _ => head,
        };
}
