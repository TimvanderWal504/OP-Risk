namespace RiskGame.Persistence.Events;

/// <summary>
/// Eén speler heeft de order-roll (of een herworp bij gelijkspel) gegooid met 2
/// dobbelstenen (FO §5.1). Puur audit/weergave-feit voor de TV — de geprojecteerde
/// <see cref="Rules.State.GameState"/> houdt geen tussentijdse worpen bij (TO §3.1 kent
/// alleen het uiteindelijke <c>TurnOrder</c>), dus dit event heeft bewust geen vouwregel
/// in <see cref="Projections.GameProjection"/>.
/// </summary>
public sealed record OrderRolled(string GameId, string PlayerId, int Die1, int Die2);
