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
/// <param name="Remaining">
/// De resterende tijd van de <see cref="Rules.State.PhaseTimer"/> die bij deze fase hoort
/// (FO §5.4): vers voor Versterken/Verplaatsen, doorgezet vanuit de vorige fase voor
/// Aanvallen. Bepaald door <see cref="Rules.TurnFlow.PhaseTimerFactory"/> vóór dit event
/// ontstaat — de vouwregel in <c>GameProjection</c> beslist niets, die vouwt alleen.
/// </param>
/// <param name="OccurredAtUtc">
/// Tijdstip waarop <paramref name="Remaining"/> is vastgesteld, gestempeld met de
/// applicatieklok (niet Martens databaseklok, zie <see cref="Rules.State.PhaseTimer"/>).
/// </param>
/// <param name="ArmiesGranted">
/// De vrije versterkingspool die deze speler bij het ingaan van Versterken krijgt, bepaald
/// door <see cref="Rules.Reinforcement.ReinforcementCalculator"/> vóórdat dit event ontstond.
/// <c>null</c> bij een overgang naar Aanvallen of Verplaatsen: daar wordt niets toegekend, en
/// dat is iets anders dan "nul legers". Bewust nullable en geen <c>0</c>-default, zodat een
/// producent die vergeet te vullen luid faalt in de projectie in plaats van stilzwijgend een
/// speler zonder versterkingen te laten beginnen.
/// </param>
public sealed record PhaseChanged(
    string GameId,
    string PlayerId,
    TurnPhase TurnPhase,
    TimeSpan Remaining,
    DateTimeOffset OccurredAtUtc,
    int? ArmiesGranted);
