using RiskGame.Rules.State;

namespace RiskGame.Persistence.Events;

/// <summary>
/// De beurt stapt naar <paramref name="TurnPhase"/> (FO §5.2): ofwel de allereerste
/// beurt na afronding van Claiming/InitialPlacement, ofwel de overgang Versterken →
/// Aanvallen → Verplaatsen binnen dezelfde beurt van <paramref name="PlayerId"/>. Geen
/// apart <see cref="GamePhase"/>-veld nodig: dit event speelt zich per definitie ná
/// setup af, dus <see cref="GamePhase.InProgress"/> is een vouwregel, geen los feit.
/// Naar de volgende spéler (nieuwe beurt) gaat via een apart <c>TurnEnded</c>-event
/// (TO §5.2), dat bij een latere plak binnenkomt.
/// </summary>
public sealed record PhaseChanged(string GameId, string PlayerId, TurnPhase TurnPhase);
