using RiskGame.Rules.Abstractions;

namespace RiskGame.Rules.Combat;

/// <summary>
/// Berekent gevechtsuitkomsten (FO §5.3): dobbelworpen vergelijken, niets anders — geen
/// validatie of state-mutatie. Of een aanval hier überhaupt aan toe mag komen (bv.
/// legeraantallen, dobbelsteenlimieten) is al door de guards afgehandeld vóór dit punt;
/// een ongeldig aantal dobbelstenen hier is dus een bug in de aanroeper, geen regelfout.
/// </summary>
public static class CombatResolver
{
    private const int MinAttackDice = 1;
    private const int MaxAttackDice = 3;
    private const int MinDefenseDice = 1;
    private const int MaxDefenseDice = 2;

    public static CombatOutcome Resolve(int attackDice, int defenseDice, IRandomSource random)
    {
        if (attackDice is < MinAttackDice or > MaxAttackDice)
        {
            throw new ArgumentOutOfRangeException(
                nameof(attackDice), attackDice,
                $"Aantal aanvalsdobbelstenen moet tussen {MinAttackDice} en {MaxAttackDice} liggen.");
        }

        if (defenseDice is < MinDefenseDice or > MaxDefenseDice)
        {
            throw new ArgumentOutOfRangeException(
                nameof(defenseDice), defenseDice,
                $"Aantal verdedigingsdobbelstenen moet tussen {MinDefenseDice} en {MaxDefenseDice} liggen.");
        }

        ArgumentNullException.ThrowIfNull(random);

        var attackerRolls = RollDescending(attackDice, random);
        var defenderRolls = RollDescending(defenseDice, random);

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

    private static IReadOnlyList<int> RollDescending(int diceCount, IRandomSource random)
    {
        var rolls = new int[diceCount];

        for (var i = 0; i < diceCount; i++)
        {
            rolls[i] = random.Next(1, 7);
        }

        Array.Sort(rolls);
        Array.Reverse(rolls);

        return rolls;
    }
}
