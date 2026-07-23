namespace RiskGame.Persistence.Events;

/// <summary>
/// Het spel is beslist (FO §7): <paramref name="WinnerPlayerIds"/> zijn de spelers die aan
/// een winconditie voldoen (<see cref="Rules.Missions.WinConditionEvaluator.Winners"/>) —
/// werelddominantie levert er altijd 1 op, Geheime missies kan er in theorie meerdere
/// tegelijk opleveren.
/// </summary>
public sealed record GameWon(string GameId, IReadOnlyList<string> WinnerPlayerIds);
