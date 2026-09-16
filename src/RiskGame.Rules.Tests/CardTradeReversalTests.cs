using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Bewijst <see cref="CardTradeReversal.Resolve"/> (FO §5.4, besluit gebruiker 2026-09-16,
/// taak 4b): welke inlegs van deze fase teruggedraaid moeten worden omdat hun opbrengst niet
/// (volledig) geplaatst is vóór een timeout. Puur rekenwerk over <see cref="TurnState"/>, geen
/// events/projectie nodig.
/// </summary>
public class CardTradeReversalTests
{
    private static UnsettledTrade Trade(int setValue, int previousTradeValue, params string[] cardIds) =>
        new(cardIds, setValue, OwnedTerritoryBonuses: [], previousTradeValue);

    private static TurnState StateWith(int armiesRemaining, params UnsettledTrade[] unsettledTrades) =>
        new(
            "p1", TurnPhase.Attack, Timer: null, PendingCombat: null,
            ArmiesRemaining: armiesRemaining, UnsettledTrades: unsettledTrades);

    [Fact]
    public void EénInleg_MetGenoegResterendeLegers_WordtTeruggedraaid()
    {
        var trade = Trade(4, previousTradeValue: 4, "c1", "c2", "c3");
        var turnState = StateWith(armiesRemaining: 6, trade);

        var result = CardTradeReversal.Resolve(turnState);

        Assert.Equal([trade], result);
    }

    [Fact]
    public void EénInleg_MetTeWeinigResterendeLegers_BlijftStaan()
    {
        var trade = Trade(4, previousTradeValue: 4, "c1", "c2", "c3");
        var turnState = StateWith(armiesRemaining: 2, trade);

        var result = CardTradeReversal.Resolve(turnState);

        Assert.Empty(result);
    }

    [Fact]
    public void TweeInlegs_MetTeWeinigVoorDeLaatste_NietsWordtTeruggedraaid()
    {
        var first = Trade(4, previousTradeValue: 4, "c1", "c2", "c3");
        var second = Trade(6, previousTradeValue: 6, "c4", "c5", "c6");
        var turnState = StateWith(armiesRemaining: 5, first, second);

        var result = CardTradeReversal.Resolve(turnState);

        Assert.Empty(result);
    }

    [Fact]
    public void TweeInlegs_MetGenoegVoorAlleenDeLaatste_AlleenDieWordtTeruggedraaid()
    {
        var first = Trade(4, previousTradeValue: 4, "c1", "c2", "c3");
        var second = Trade(6, previousTradeValue: 6, "c4", "c5", "c6");
        var turnState = StateWith(armiesRemaining: 7, first, second);

        var result = CardTradeReversal.Resolve(turnState);

        Assert.Equal([second], result);
    }

    [Fact]
    public void TweeInlegs_MetGenoegVoorBeide_BeideWordenTeruggedraaidMeestRecenteEerst()
    {
        var first = Trade(4, previousTradeValue: 4, "c1", "c2", "c3");
        var second = Trade(6, previousTradeValue: 6, "c4", "c5", "c6");
        var turnState = StateWith(armiesRemaining: 10, first, second);

        var result = CardTradeReversal.Resolve(turnState);

        Assert.Equal([second, first], result);
    }

    [Fact]
    public void ZonderInlegs_LevertEenLegeLijstOp()
    {
        var turnState = StateWith(armiesRemaining: 3);

        var result = CardTradeReversal.Resolve(turnState);

        Assert.Empty(result);
    }
}
