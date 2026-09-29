namespace RiskGame.Rules.State;

/// <summary>
/// Houdt het volledige verloop bij (<see cref="GameState.RecentActions"/>, nieuwste eerst): puur
/// en deterministisch, zodat de projectie alleen nog aanroept en de samenvoegregels los te testen
/// zijn. Hoeveel regels een client krijgt, bepaalt de API (de TV de laatste paar, het tabblad
/// Spelverloop op de telefoon alles; besluit gebruiker 2026-09-26).
/// </summary>
public static class RecentActionLog
{
    /// <summary>
    /// Voegt <paramref name="action"/> toe. Heeft de bovenste regel dezelfde sleutel (zie
    /// <see cref="CanMerge"/>), dan werkt die regel bij en blijft zijn <see cref="RecentAction.Sequence"/>
    /// gelijk; anders komt de actie vooraan met het volgende volgnummer. De <c>Sequence</c> van
    /// <paramref name="action"/> zelf wordt genegeerd.
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

        return [next, .. log];
    }

    /// <summary>
    /// Vat de bovenste reeks regels van <paramref name="kind"/> voor dezelfde gebeurteniskaart samen
    /// tot één regel zonder speler ("Iedereen …"), als die reeks precies alle
    /// <paramref name="participantIds"/> dekt, allemaal met hetzelfde bedrag (besluit gebruiker
    /// 2026-09-29: zelfde moment, zelfde uitkomst voor iedereen = één regel). Anders blijft het log
    /// ongewijzigd. De samengevatte regel houdt het volgnummer van de nieuwste regel, zodat het
    /// volgnummer blijft oplopen.
    /// </summary>
    public static IReadOnlyList<RecentAction> CollapseToEveryone(
        IReadOnlyList<RecentAction> log, RecentActionKind kind, string eventId, IReadOnlyCollection<string> participantIds)
    {
        ArgumentNullException.ThrowIfNull(log);
        ArgumentNullException.ThrowIfNull(participantIds);

        var run = log
            .TakeWhile(action => action.Kind == kind && action.EventId == eventId && action.PlayerId is not null)
            .ToArray();

        var coversEveryone = run.Length >= 2
            && run.Length == participantIds.Count
            && run.Select(action => action.PlayerId!).ToHashSet().SetEquals(participantIds)
            && run.Select(action => action.Amount).Distinct().Count() == 1;

        return coversEveryone ? [run[0] with { PlayerId = null }, .. log.Skip(run.Length)] : log;
    }

    /// <summary>
    /// Werkt de meest recente regel bij die aan <paramref name="matches"/> voldoet, op zijn eigen
    /// plek en met zijn eigen volgnummer — voor een actie die bij een eerdere regel hoort maar
    /// niet per se bij de bovenste (een meeverplaatsing na een verovering die een uitschakeling
    /// opleverde). Geen passende regel is geen fout: het spel liep al vóór er een verloop bestond,
    /// of vóór het verloop volledig bewaard werd (tot 2026-09-26 hoogstens 10 regels); dan blijft
    /// het log ongewijzigd.
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
