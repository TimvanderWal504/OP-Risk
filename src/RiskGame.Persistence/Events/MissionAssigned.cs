namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft bij spelstart een geheime missie toegewezen gekregen (FO §6.1). Draagt
/// altijd de uiteindelijke missie-id: eventuele vervanging via
/// <see cref="Rules.Missions.EliminatePlayerMission.FallbackMissionId"/> is al door de rules
/// engine bepaald vóórdat dit event ontstaat, niet iets wat de projectie nog moet oplossen.
/// </summary>
public sealed record MissionAssigned(string GameId, string PlayerId, string MissionId);
