namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler is uitgeschakeld doordat zijn laatste gebied veroverd werd (FO §7):
/// <paramref name="EliminatedByPlayerId"/> is altijd de veroveraar van dat laatste gebied,
/// en ontvangt daarmee ook de handkaarten van de uitgeschakelde speler. De "≥ 6 kaarten →
/// direct verplicht inleggen"-vervolgregel is command-orchestratie (een latere bouwstap),
/// geen onderdeel van deze vouwregel.
/// </summary>
public sealed record PlayerEliminated(string GameId, string EliminatedPlayerId, string EliminatedByPlayerId);
