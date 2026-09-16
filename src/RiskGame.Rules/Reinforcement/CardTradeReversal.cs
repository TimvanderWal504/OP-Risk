using RiskGame.Rules.State;

namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Welke inlegs van deze beurt teruggedraaid moeten worden omdat hun opbrengst niet
/// (volledig) geplaatst is vóór een timeout (FO §5.4, besluit gebruiker 2026-09-16). Puur
/// rekenwerk over <see cref="TurnState.UnsettledTrades"/>, geen state-mutatie — het
/// daadwerkelijk terugdraaien gebeurt via het <c>CardTradeReverted</c>-event (taak 4b).
/// </summary>
public static class CardTradeReversal
{
    /// <summary>
    /// Loopt van de laatste inleg terug naar de eerste: zolang de nog onverdeelde pool
    /// (<see cref="TurnState.ArmiesRemaining"/>) de volledige setwaarde van die inleg nog
    /// bevat, wordt hij teruggedraaid en gaat zijn setwaarde van de resterende pool af;
    /// zodra een inleg er niet meer volledig in past, stopt de terugdraai daar — wat er dan
    /// van de pool overblijft (incl. een eventuele basispool) vervalt gewoon. LIFO omdat de
    /// meest recente inleg het minst "verwerkt" is: bij niets geplaatst is elke eerdere
    /// inleg net zo aannemelijk (mogelijk al) benut als de pool zelf.
    /// </summary>
    public static IReadOnlyList<UnsettledTrade> Resolve(TurnState turnState)
    {
        ArgumentNullException.ThrowIfNull(turnState);

        var remaining = turnState.ArmiesRemaining;
        var toRevert = new List<UnsettledTrade>();

        for (var i = turnState.UnsettledTrades.Count - 1; i >= 0; i--)
        {
            var trade = turnState.UnsettledTrades[i];

            if (remaining < trade.SetValue)
            {
                break;
            }

            toRevert.Add(trade);
            remaining -= trade.SetValue;
        }

        return toRevert;
    }
}
