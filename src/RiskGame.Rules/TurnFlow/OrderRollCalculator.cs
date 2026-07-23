using RiskGame.Rules.Abstractions;

namespace RiskGame.Rules.TurnFlow;

/// <summary>Eén order-roll-worp van 2 dobbelstenen door één speler (FO §2.1).</summary>
public readonly record struct OrderRollThrow(string PlayerId, int Die1, int Die2)
{
    public int Total => Die1 + Die2;
}

/// <summary>
/// De voortgang van de order-roll na een reeks <see cref="OrderRollThrow"/>'s:
/// <see cref="StillToRoll"/> is wie er nu nog moet gooien in de lopende (deel)ronde,
/// <see cref="Winner"/> is niet-null zodra er een unieke hoogste worp is.
/// </summary>
public sealed record OrderRollProgress(IReadOnlyList<string> StillToRoll, string? Winner);

/// <summary>
/// Berekent de order-roll (FO §2.1): 2 dobbelstenen per speler, hoogste totaal begint; bij
/// een gelijke hoogste worp gooien alleen de gelijken opnieuw. Puur rekenwerk over de al
/// gegooide worpen, geen dobbelen zelf — dat gebeurt via <see cref="IRandomSource"/> in de
/// aanroeper, net als <see cref="Combat.CombatResolver"/>. De <c>OrderRolled</c>-events
/// hebben bewust geen vouwregel in de projectie (zie de doc-comment op dat event), dus deze
/// klasse repliceert de rondes uit de ruwe worpen-lijst in plaats van uit <c>GameState</c>.
/// </summary>
public static class OrderRollCalculator
{
    public static (int Die1, int Die2) RollTwoDice(IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(random);

        return (random.Next(1, 7), random.Next(1, 7));
    }

    /// <summary>
    /// <paramref name="allPlayerIds"/> is ronde 1; zodra een ronde compleet is (evenveel
    /// worpen als deelnemers) bepaalt de hoogste som wie doorgaat naar de volgende ronde —
    /// 1 winnaar sluit af, meerdere gelijken vormen de volgende (deel)ronde. Een onvolledige
    /// laatste ronde levert op wie er nog moet gooien.
    /// </summary>
    public static OrderRollProgress Evaluate(
        IReadOnlyList<string> allPlayerIds, IReadOnlyList<OrderRollThrow> throws)
    {
        ArgumentNullException.ThrowIfNull(allPlayerIds);
        ArgumentNullException.ThrowIfNull(throws);

        var participants = allPlayerIds;
        var offset = 0;

        while (true)
        {
            var roundThrows = throws.Skip(offset).Take(participants.Count).ToArray();

            if (roundThrows.Length < participants.Count)
            {
                var alreadyRolled = roundThrows.Select(t => t.PlayerId).ToHashSet();
                var stillToRoll = participants.Where(id => !alreadyRolled.Contains(id)).ToArray();

                return new OrderRollProgress(stillToRoll, Winner: null);
            }

            offset += participants.Count;

            var highestTotal = roundThrows.Max(t => t.Total);
            var tied = roundThrows.Where(t => t.Total == highestTotal).Select(t => t.PlayerId).ToArray();

            if (tied.Length == 1)
            {
                return new OrderRollProgress(StillToRoll: [], tied[0]);
            }

            participants = tied;
        }
    }
}
