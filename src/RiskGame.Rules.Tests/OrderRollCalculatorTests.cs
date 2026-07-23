using RiskGame.Rules.TurnFlow;

namespace RiskGame.Rules.Tests;

public sealed class OrderRollCalculatorTests
{
    [Fact]
    public void Evaluate_ZonderWorpen_IedereenMoetNogGooien()
    {
        var progress = OrderRollCalculator.Evaluate(["p1", "p2", "p3"], []);

        Assert.Equal(["p1", "p2", "p3"], progress.StillToRoll);
        Assert.Null(progress.Winner);
    }

    [Fact]
    public void Evaluate_MidRonde_LevertAlleenNogNietGegooidenOp()
    {
        var throws = new[] { new OrderRollThrow("p1", 4, 3) };

        var progress = OrderRollCalculator.Evaluate(["p1", "p2", "p3"], throws);

        Assert.Equal(["p2", "p3"], progress.StillToRoll);
        Assert.Null(progress.Winner);
    }

    [Fact]
    public void Evaluate_MetUniekeHoogsteWorp_LevertDieSpelerAlsWinnaarOp()
    {
        var throws = new[]
        {
            new OrderRollThrow("p1", 4, 3),
            new OrderRollThrow("p2", 6, 6),
            new OrderRollThrow("p3", 2, 2),
        };

        var progress = OrderRollCalculator.Evaluate(["p1", "p2", "p3"], throws);

        Assert.Equal("p2", progress.Winner);
        Assert.Empty(progress.StillToRoll);
    }

    [Fact]
    public void Evaluate_BijGelijkspelOpDeHoogsteWorp_MoetenAlleenDeGelijkenOpnieuwGooien()
    {
        var throws = new[]
        {
            new OrderRollThrow("p1", 6, 4), // 10
            new OrderRollThrow("p2", 5, 5), // 10, gelijk aan p1
            new OrderRollThrow("p3", 3, 2), // 5
        };

        var progress = OrderRollCalculator.Evaluate(["p1", "p2", "p3"], throws);

        Assert.Null(progress.Winner);
        Assert.Equal(["p1", "p2"], progress.StillToRoll);
    }

    [Fact]
    public void Evaluate_NaHerworpMetUniekeWinnaar_SluitAf()
    {
        var throws = new[]
        {
            new OrderRollThrow("p1", 6, 4), // 10
            new OrderRollThrow("p2", 5, 5), // 10, gelijk aan p1
            new OrderRollThrow("p3", 3, 2), // 5
            new OrderRollThrow("p1", 6, 6), // herworp: 12
            new OrderRollThrow("p2", 1, 1), // herworp: 2
        };

        var progress = OrderRollCalculator.Evaluate(["p1", "p2", "p3"], throws);

        Assert.Equal("p1", progress.Winner);
        Assert.Empty(progress.StillToRoll);
    }

    [Fact]
    public void Evaluate_NaHerworpMetOpnieuwGelijkspel_GaatNogEenRondeVerder()
    {
        var throws = new[]
        {
            new OrderRollThrow("p1", 6, 4), // 10
            new OrderRollThrow("p2", 5, 5), // 10, gelijk aan p1
            new OrderRollThrow("p3", 3, 2), // 5
            new OrderRollThrow("p1", 3, 3), // herworp: 6, weer gelijk
            new OrderRollThrow("p2", 4, 2), // herworp: 6, weer gelijk
        };

        var progress = OrderRollCalculator.Evaluate(["p1", "p2", "p3"], throws);

        Assert.Null(progress.Winner);
        Assert.Equal(["p1", "p2"], progress.StillToRoll);
    }
}
