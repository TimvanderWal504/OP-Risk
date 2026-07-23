using RiskGame.Rules.State;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// Wie er na de huidige actieve speler aan zet is (FO §7, §11.2). Puur rekenwerk over
/// <see cref="GameState.TurnOrder"/> en <see cref="GameState.StatusOf"/>, geen
/// state-mutatie — het daadwerkelijk doorschuiven van de beurt hoort bij de
/// command-orchestratie in een latere bouwstap (TO §11, stap 3).
/// </summary>
public static class TurnOrderCalculator
{
    /// <summary>
    /// De eerstvolgende speler in <see cref="GameState.TurnOrder"/> na de huidige actieve
    /// speler die niet uitgeschakeld is en niet op auto-pass staat. Loopt rond over de
    /// beurtvolgorde. Null als er geen lopende beurt is, of als niemand anders in
    /// aanmerking komt — dat laatste is een einde-spel-situatie (wincondities: latere
    /// bouwstap), geen turn-flow-situatie.
    /// </summary>
    public static string? NextActivePlayerId(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        if (state.TurnState is null)
        {
            return null;
        }

        var order = state.TurnOrder;
        var currentPlayerId = state.TurnState.ActivePlayerId;

        var startIndex = -1;

        for (var i = 0; i < order.Count; i++)
        {
            if (order[i] == currentPlayerId)
            {
                startIndex = i;
                break;
            }
        }

        if (startIndex < 0)
        {
            return null;
        }

        for (var offset = 1; offset < order.Count; offset++)
        {
            var candidateId = order[(startIndex + offset) % order.Count];

            if (state.StatusOf(candidateId) == PlayerStatus.Waiting)
            {
                return candidateId;
            }
        }

        return null;
    }
}
