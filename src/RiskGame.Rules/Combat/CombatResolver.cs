using RiskGame.Rules.Abstractions;

namespace RiskGame.Rules.Combat;

/// <summary>
/// Berekent gevechtsuitkomsten (FO §5.3): dobbelworpen gooien en vergelijken, niets
/// anders — geen validatie of state-mutatie. Of een aanval hier überhaupt aan toe mag
/// komen (bv. legeraantallen, dobbelsteenlimieten) is al door de guards afgehandeld
/// vóór dit punt; een ongeldig aantal dobbelstenen hier is dus een bug in de
/// aanroeper, geen regelfout.
/// </summary>
/// <remarks>
/// De aanvaller gooit en mag daarna — nog vóórdat de verdediger gooit — met een
/// actieve <see cref="Roles.RerollEffect"/> zelf gekozen dobbelstenen herwerpen (FO
/// §5.3/§8): <see cref="RollDice"/> en <see cref="RerollDie"/> maken dat mogelijk als
/// losse stappen vóór <see cref="Compare"/>. <see cref="Resolve"/> blijft de
/// bestaande ingang voor het geval zonder herwerp.
/// </remarks>
public static class CombatResolver
{
    private const int MinAttackDice = 1;
    private const int MaxAttackDice = 3;
    private const int MinDefenseDice = 1;
    private const int MaxDefenseDice = 2;

    public static CombatOutcome Resolve(int attackDice, int defenseDice, IRandomSource random)
    {
        ValidateDiceCount(attackDice, MinAttackDice, MaxAttackDice, nameof(attackDice), "aanvalsdobbelstenen");
        ValidateDiceCount(defenseDice, MinDefenseDice, MaxDefenseDice, nameof(defenseDice), "verdedigingsdobbelstenen");
        ArgumentNullException.ThrowIfNull(random);

        var attackerRolls = RollDice(attackDice, random);
        var defenderRolls = RollDice(defenseDice, random);

        return Compare(attackerRolls, defenderRolls);
    }

    /// <summary>Gooit <paramref name="diceCount"/> dobbelstenen, aflopend gesorteerd.</summary>
    public static IReadOnlyList<int> RollDice(int diceCount, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(random);

        if (diceCount < 1)
        {
            throw new ArgumentOutOfRangeException(
                nameof(diceCount), diceCount, "Er moet minimaal 1 dobbelsteen gegooid worden.");
        }

        var rolls = new int[diceCount];

        for (var i = 0; i < diceCount; i++)
        {
            rolls[i] = random.Next(1, 7);
        }

        return SortDescending(rolls);
    }

    /// <summary>
    /// Herwerpt de dobbelsteen op <paramref name="dieIndex"/> in <paramref name="rolls"/> en
    /// levert de opnieuw aflopend gesorteerde worp. Puur de dobbelsteen-mechaniek van de
    /// `Reroll`-rol (FO §8) — of de speler dit nog mag (aantal per beurt) bepaalt de
    /// aanroeper via <see cref="Roles.RoleEffects.Active{TEffect}"/>.
    /// </summary>
    public static IReadOnlyList<int> RerollDie(IReadOnlyList<int> rolls, int dieIndex, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(rolls);
        ArgumentNullException.ThrowIfNull(random);

        if (dieIndex < 0 || dieIndex >= rolls.Count)
        {
            throw new ArgumentOutOfRangeException(
                nameof(dieIndex), dieIndex, $"Er zijn maar {rolls.Count} dobbelstenen om te herwerpen.");
        }

        var updated = rolls.ToArray();
        updated[dieIndex] = random.Next(1, 7);

        return SortDescending(updated);
    }

    /// <summary>Vergelijkt een (eventueel herworpen) aanvalsworp met de verdedigingsworp.</summary>
    public static CombatOutcome Compare(IReadOnlyList<int> attackerRolls, IReadOnlyList<int> defenderRolls)
    {
        ArgumentNullException.ThrowIfNull(attackerRolls);
        ArgumentNullException.ThrowIfNull(defenderRolls);

        var attackerLosses = 0;
        var defenderLosses = 0;
        var pairs = Math.Min(attackerRolls.Count, defenderRolls.Count);

        for (var i = 0; i < pairs; i++)
        {
            // Gelijke worp: de verdediger wint (FO §5.3).
            if (attackerRolls[i] > defenderRolls[i])
            {
                defenderLosses++;
            }
            else
            {
                attackerLosses++;
            }
        }

        return new CombatOutcome(attackerRolls, defenderRolls, attackerLosses, defenderLosses);
    }

    private static void ValidateDiceCount(int diceCount, int min, int max, string paramName, string label)
    {
        if (diceCount < min || diceCount > max)
        {
            throw new ArgumentOutOfRangeException(
                paramName, diceCount, $"Aantal {label} moet tussen {min} en {max} liggen.");
        }
    }

    private static IReadOnlyList<int> SortDescending(int[] rolls)
    {
        Array.Sort(rolls);
        Array.Reverse(rolls);

        return rolls;
    }
}
