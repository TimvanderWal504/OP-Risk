namespace RiskGame.Persistence.Events;

/// <summary>
/// De missie van een speler is vervuld (FO §6.1). Puur audit/weergave-feit voor de TV, net
/// als <see cref="DiceRolled"/>: <see cref="Rules.Missions.WinConditionEvaluator.Winners"/>
/// berekent dit al puur uit <see cref="Rules.State.Player.Mission"/> en de rest van de
/// state, dus dit event heeft bewust geen eigen vouwregel in
/// <see cref="Projections.GameProjection"/>.
/// </summary>
public sealed record MissionCompleted(string GameId, string PlayerId, string MissionId);
