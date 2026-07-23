namespace RiskGame.Persistence.Events;

/// <summary>
/// Eén worp tijdens een gevecht (FO §5.3): de aanvalsworp, een eventuele herworp via een
/// actieve <c>Reroll</c>-rol (FO §8), of de verdedigingsworp. Puur audit/weergave-feit voor
/// de TV, net als <see cref="OrderRolled"/> — de geprojecteerde
/// <see cref="Rules.State.GameState"/> houdt geen tussentijdse worpen bij, alleen het
/// uiteindelijke resultaat via <see cref="CombatResolved"/>, dus dit event heeft bewust
/// geen vouwregel in <see cref="Projections.GameProjection"/>.
/// </summary>
public sealed record DiceRolled(string GameId, string PlayerId, IReadOnlyList<int> Rolls);
