namespace RiskGame.Rules.Reinforcement;

/// <summary>
/// Eén inleg van deze beurt waarvan de opbrengst nog niet (volledig) geplaatst is (FO §5.4,
/// besluit gebruiker 2026-09-16): kaarten mogen niet "verdampen" door een timeout, dus wordt
/// zo'n inleg teruggedraaid in plaats van de bijbehorende legers stilzwijgend te laten
/// vervallen. Verzameld in <see cref="State.TurnState.UnsettledTrades"/>, geproduceerd door de
/// vouwregel van het <c>CardsTraded</c>-event (RiskGame.Persistence) en geconsumeerd door
/// <see cref="CardTradeReversal.Resolve"/>.
/// </summary>
/// <param name="PreviousTradeValue">
/// De inlegwaarde die vóór deze inleg gold — wat <see cref="State.DeckState.NextTradeValue"/>
/// weer wordt als deze inleg teruggedraaid wordt.
/// </param>
public sealed record UnsettledTrade(
    IReadOnlyList<string> CardIds,
    int SetValue,
    IReadOnlyList<TerritoryBonus> OwnedTerritoryBonuses,
    int PreviousTradeValue);
