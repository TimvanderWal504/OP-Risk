using RiskGame.Rules.Reinforcement;

namespace RiskGame.Persistence.Events;

/// <summary>
/// Een eerdere inleg deze fase is teruggedraaid omdat de opbrengst niet (volledig) geplaatst
/// was vóór een timeout (FO §5.4, besluit gebruiker 2026-09-16, taak 4b): kaarten mogen niet
/// "verdampen". Draagt zijn eigen uitkomst — welke kaarten terug, welk bedrag eraf, welke
/// bonussen eraf, welke inlegwaarde hersteld wordt — vastgesteld door
/// <see cref="CardTradeReversal.Resolve"/> vóórdat dit event ontstaat, zodat de projectie
/// alleen nog vouwt (src/CLAUDE.md, event sourcing-kaders). Veilig te doen zonder de rest van
/// de beurt te raken: tussen inleg en timeout kan geen aanval plaatsvinden (Versterken kent
/// geen gevechten; in Aanvallen blokkeert de ≥6-verplichting zelf <c>DeclareAttack</c> zolang
/// de pool open staat) en de aflegstapel wordt binnen een beurt nooit hertschud (alleen bij
/// <c>EndTurn</c>) — de kaarten liggen er dus nog.
/// </summary>
/// <param name="RestoredTradeValue">
/// De inlegwaarde die vóór de teruggedraaide inleg gold (<see cref="UnsettledTrade.PreviousTradeValue"/>).
/// </param>
public sealed record CardTradeReverted(
    string GameId,
    string PlayerId,
    IReadOnlyList<string> CardIds,
    int SetValue,
    IReadOnlyList<TerritoryBonus> OwnedTerritoryBonuses,
    int RestoredTradeValue);
