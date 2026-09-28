using RiskGame.Rules.State;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// Wanneer een ronde om is en er een gebeurteniskaart getrokken wordt (FO §9.2). Puur rekenwerk
/// over <see cref="GameState.TurnOrder"/>; het trekken zelf orkestreert de API bij beurteinde.
/// </summary>
public static class EventRoundCalculator
{
    /// <summary>
    /// Of de beurt die nu eindigt de ronde afsluit: de volgende speler staat in de beurtvolgorde
    /// niet ná de huidige, de volgorde loopt dus rond. Uitgeschakelde spelers slaat
    /// <see cref="TurnOrderCalculator.NextActivePlayerId"/> al over, dus ook een uitgeschakelde
    /// laatste speler verschuift de grens vanzelf. De eerste beurt van het spel is van de eerste
    /// speler in de volgorde, dus de eerste grens valt na de eerste volle ronde.
    /// </summary>
    public static bool IsRoundBoundary(GameState state, string nextPlayerId)
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(nextPlayerId);

        if (state.TurnState is null)
        {
            throw new InvalidOperationException("Een rondegrens bestaat alleen tussen twee beurten; er loopt geen beurt.");
        }

        var order = state.TurnOrder.ToList();

        return order.IndexOf(nextPlayerId) <= order.IndexOf(state.TurnState.ActivePlayerId);
    }

    /// <summary>Of er bij deze beurtwissel een gebeurteniskaart getrokken wordt: gebeurtenisronde aan én rondegrens.</summary>
    public static bool DrawsEventCard(GameState state, string nextPlayerId) =>
        state.Settings.EventsEnabled && IsRoundBoundary(state, nextPlayerId);
}
