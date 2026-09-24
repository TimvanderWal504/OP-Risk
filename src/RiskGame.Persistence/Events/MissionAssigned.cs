namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft een geheime missie toegewezen gekregen (FO §6.1) — bij spelstart, of
/// (opnieuw) tussentijds wanneer het doelwit van een <c>EliminatePlayer</c>-missie door een
/// ándere speler wordt uitgeschakeld en de missiehouder automatisch op een fallback-missie
/// overstapt (<see cref="Rules.Missions.MissionAssignmentCalculator.
/// ResolveFallbacksAfterElimination"/>). Draagt altijd de uiteindelijke missie-id: welke
/// fallback-missie dat is, is al door de rules engine gekozen (willekeurig, uit de nog
/// ongebruikte <see cref="Rules.Missions.ConquerContinentsMission"/>-categorie) vóórdat dit
/// event ontstaat, niet iets wat de projectie nog moet oplossen.
/// </summary>
public sealed record MissionAssigned(string GameId, string PlayerId, string MissionId);
