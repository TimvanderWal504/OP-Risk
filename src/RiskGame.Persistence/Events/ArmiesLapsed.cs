namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler kon zijn versterkingen nergens kwijt omdat al zijn gebieden deze ronde afgesloten
/// waren (FO §9.2, besluit gebruiker 2026-10-01): de rest van zijn pool vervalt. Vlak vóór de
/// fase-overgang die de pool toch al leegt — dit event zet hem expliciet op 0 en geeft het verloop
/// een regel, zodat de legers niet ongemerkt verdwijnen.
/// </summary>
/// <param name="EventId">De gebeurteniskaart die de gebieden afsloot.</param>
public sealed record ArmiesLapsed(string GameId, string PlayerId, int Amount, string EventId);
