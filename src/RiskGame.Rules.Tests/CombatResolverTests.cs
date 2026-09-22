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

    [Fact]
    public void Herwerp_VervangtDeDobbelsteenEnSorteertOpnieuwAflopend()
    {
        var random = new FixedRandomSource(6);

        var herworpen = CombatResolver.RerollDie([5, 2], dieIndex: 1, random);

        Assert.Equal([6, 5], herworpen.Rolls);
    }

    [Fact]
    public void Herwerp_OngeldigeIndex_GooitException()
    {
        var random = new FixedRandomSource(6);

        Assert.Throws<ArgumentOutOfRangeException>(
            () => CombatResolver.RerollDie([5, 2], dieIndex: 2, random));
    }

    [Fact]
    public void Herwerp_NieuweWaardeSpringtNaarVoren_NieuwePositieWijstDaarNaartoe()
    {
        // Dobbelsteen op index 1 (waarde 2) herwerpt naar 6: springt na het sorteren naar
        // voren (index 0) — een kale "dieIndex: 1" zou hier de verkeerde steen aanwijzen.
        var random = new FixedRandomSource(6);

        var herworpen = CombatResolver.RerollDie([5, 2], dieIndex: 1, random);

        Assert.Equal([6, 5], herworpen.Rolls);
        Assert.Equal(0, herworpen.NewDieIndex);
    }

    [Fact]
    public void Herwerp_NieuweWaardeZaktNaarAchteren_NieuwePositieWijstDaarNaartoe()
    {
        // Dobbelsteen op index 0 (waarde 5) herwerpt naar 1: zakt na het sorteren naar
        // achteren (index 1).
        var random = new FixedRandomSource(1);

        var herworpen = CombatResolver.RerollDie([5, 3], dieIndex: 0, random);

        Assert.Equal([3, 1], herworpen.Rolls);
        Assert.Equal(1, herworpen.NewDieIndex);
    }

    [Fact]
    public void Herwerp_GelijkeWaardeAlsEenAndereDobbelsteen_VindtTochDeJuisteHerworpenSteenTerug()
    {
        // Herwerp index 0 (waarde 5) naar een 3 — gelijk aan de al aanwezige 3 op index 1.
        // Zonder de eigen "IsRerolled"-markering zou een kale waarde-vergelijking hier niet
        // kunnen onderscheiden welke van de twee 3'en de zojuist herworpen steen is.
        var random = new FixedRandomSource(3);

        var herworpen = CombatResolver.RerollDie([5, 3], dieIndex: 0, random);

        Assert.Equal([3, 3], herworpen.Rolls);
        Assert.Equal(0, herworpen.NewDieIndex);
    }

    [Fact]
    public void VolledigeFlow_HerwerpVanDeAanvallersworpKanDeUitkomstOmdraaien()
    {
        // Aanvaller gooit 2 (verliest tegen verdedigers 4), herwerpt naar 6 (wint alsnog),
        // dan pas gooit de verdediger — precies de nieuwe volgorde uit FO §5.3/§8.
        var random = new FixedRandomSource(2, 6, 4);

        var eersteWorp = CombatResolver.RollDice(1, random);
        var herworpenWorp = CombatResolver.RerollDie(eersteWorp, dieIndex: 0, random);
        var verdedigersworp = CombatResolver.RollDice(1, random);

        var outcome = CombatResolver.Compare(herworpenWorp.Rolls, verdedigersworp);

        Assert.Equal([6], herworpenWorp.Rolls);
        Assert.Equal(0, outcome.AttackerLosses);
        Assert.Equal(1, outcome.DefenderLosses);
    }
}
