using RiskGame.Rules.Combat;

namespace RiskGame.Rules.Tests;

public class CombatResolverTests
{
    [Fact]
    public void EenTegenEen_HoogsteWorpWint()
    {
        var random = new FixedRandomSource(5, 3);

        var outcome = CombatResolver.Resolve(1, 1, random);

        Assert.Equal(0, outcome.AttackerLosses);
        Assert.Equal(1, outcome.DefenderLosses);
    }

    [Fact]
    public void EenTegenEen_GelijkeWorp_VerdedigerWint()
    {
        var random = new FixedRandomSource(4, 4);

        var outcome = CombatResolver.Resolve(1, 1, random);

        Assert.Equal(1, outcome.AttackerLosses);
        Assert.Equal(0, outcome.DefenderLosses);
    }

    [Fact]
    public void DrieTegenTwee_BeideParenWordenVergeleken()
    {
        // Aanvaller: 6, 5, 2 (aflopend) — Verdediger: 6, 3 (aflopend).
        // Paar 1: 6 vs 6 → gelijk, verdediger wint. Paar 2: 5 vs 3 → aanvaller wint.
        var random = new FixedRandomSource(2, 6, 5, 6, 3);

        var outcome = CombatResolver.Resolve(3, 2, random);

        Assert.Equal([6, 5, 2], outcome.AttackerRolls);
        Assert.Equal([6, 3], outcome.DefenderRolls);
        Assert.Equal(1, outcome.AttackerLosses);
        Assert.Equal(1, outcome.DefenderLosses);
    }

    [Fact]
    public void DrieTegenEen_AlleenHoogsteParenTellenMee()
    {
        var random = new FixedRandomSource(1, 2, 6, 3);

        var outcome = CombatResolver.Resolve(3, 1, random);

        Assert.Equal(0, outcome.AttackerLosses);
        Assert.Equal(1, outcome.DefenderLosses);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4)]
    public void OngeldigAantalAanvalsdobbelstenen_GooitException(int attackDice)
    {
        var random = new FixedRandomSource(1);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => CombatResolver.Resolve(attackDice, 1, random));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    public void OngeldigAantalVerdedigingsdobbelstenen_GooitException(int defenseDice)
    {
        var random = new FixedRandomSource(1);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => CombatResolver.Resolve(1, defenseDice, random));
    }
}
