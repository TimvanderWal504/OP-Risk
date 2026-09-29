namespace RiskGame.Rules.State;

/// <summary>
/// De stand van de gebeurtenisronde (FO §9.2), als één waarde op <see cref="GameState"/>.
/// </summary>
/// <param name="CurrentEventId">
/// De laatst getrokken gebeurteniskaart; blijft staan tot de volgende trekking (FO §2.2: de
/// stand toont hem). Null vóór de eerste trekking.
/// </param>
/// <param name="DrawPile">De nog te trekken kaarten, bovenste eerst; leeg betekent "bij de volgende trekking schudden".</param>
/// <param name="PendingAttrition">Lopende <c>ArmyAttrition</c>-keuzes tussen twee beurten; null als er niets openstaat.</param>
public sealed record EventRoundState(
    string? CurrentEventId,
    IReadOnlyList<string> DrawPile,
    PendingAttrition? PendingAttrition)
{
    /// <summary>Nog niets getrokken, niets geschud, niets open.</summary>
    public static EventRoundState Empty { get; } = new(CurrentEventId: null, DrawPile: [], PendingAttrition: null);
}

/// <summary>
/// Een <c>ArmyAttrition</c>-kaart wacht op de keuzes van de spelers met keuzevrijheid (FO §9.2).
/// Zolang dit openstaat is er geen <see cref="TurnState"/>: er loopt geen beurt.
/// </summary>
/// <param name="EventId">De getrokken attrition-kaart.</param>
/// <param name="Amount">Hoeveel legers elke speler moet afstaan.</param>
/// <param name="ChooserPlayerIds">
/// Wie bij de trekking zelf moest kiezen (vast, ook als ze al gekozen hebben): de TV toont
/// "Nog N van M" en een vinkje per kiezer, en dat is zonder deze lijst niet meer te reconstrueren.
/// </param>
/// <param name="AwaitingPlayerIds">Wie nog moet kiezen.</param>
/// <param name="NextPlayerId">
/// Wiens beurt begint zodra iedereen gekozen heeft. Moet hier vastliggen: zonder
/// <see cref="TurnState"/> is de volgende speler niet meer af te leiden.
/// </param>
public sealed record PendingAttrition(
    string EventId,
    int Amount,
    IReadOnlyList<string> ChooserPlayerIds,
    IReadOnlyList<string> AwaitingPlayerIds,
    string NextPlayerId);
