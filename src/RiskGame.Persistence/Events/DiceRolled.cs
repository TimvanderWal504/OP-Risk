namespace RiskGame.Persistence.Events;

/// <summary>
/// Eén worp tijdens een gevecht (FO §5.3): de aanvalsworp of de verdedigingsworp. Puur
/// audit/weergave-feit voor de TV, net als <see cref="OrderRolled"/> — bewust geen vouwregel in
/// <see cref="Projections.GameProjection"/>.
/// </summary>
/// <remarks>
/// Sinds <see cref="AttackDeclared"/> zelf de aanvalsworp draagt (plan-rollen C1/C6) is dít
/// event niet meer de enige/leidende plek waar die worp staat — <see cref="Rules.State.PendingCombat.AttackerRolls"/>
/// is dat, en <see cref="Rules.Combat.AttackGuards.CanChooseDefenseDice"/> leest daar ook uit
/// (niet meer uit de rauwe event-stream). Een herwerp krijgt géén eigen <c>DiceRolled</c> —
/// dat is <see cref="AttackDieRerolled"/>, dat zowel de vouwregel als de TV/telefoon-narratie
/// bedient. <c>DiceRolled</c> blijft dus alleen voor de eerste aanvalsworp en de
/// verdedigingsworp: puur narratief, nooit gevouwen, nooit de bron van waarheid.
/// </remarks>
public sealed record DiceRolled(string GameId, string PlayerId, IReadOnlyList<int> Rolls);
