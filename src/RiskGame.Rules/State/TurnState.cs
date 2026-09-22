using RiskGame.Rules.Reinforcement;

namespace RiskGame.Rules.State;

/// <summary>De stand van de lopende beurt (TO §3.1).</summary>
/// <param name="Timer">
/// Null betekent "geen timer": de lobby en de setup-fases hebben er geen, en ook de
/// verdediger-keuze is bewust timerloos (FO §5.3).
/// </param>
/// <param name="PendingCombat">
/// Niet-null zolang een gevecht loopt. De beurt blijft dan in
/// <see cref="TurnPhase.Attack"/> — wachten op de verdediger is geen aparte fase (TO §4.1).
/// </param>
/// <param name="PausedAttackTarget">
/// Zie <see cref="AttackEngagement"/>: welk gebiedspaar de beurttimer-pauze op dit moment
/// vasthoudt. Null zolang er geen doorlopende belegering is (nog geen aanval gedaan deze
/// fase, of het laatste doelwit is losgelaten/veroverd).
/// </param>
/// <param name="ArmiesRemaining">
/// Nog te plaatsen legers uit de vrije versterkingspool (FO §5.2): gezet bij het ingaan van
/// <see cref="TurnPhase.Reinforce"/> op <see cref="Reinforcement.ReinforcementCalculator.CalculateArmies"/>,
/// nadien bijgewerkt door <c>ArmiesReinforced</c> (aftrek) en <c>CardsTraded</c> (optelling
/// van de setwaarde). Buiten Versterken ongebruikt (0).
/// </param>
/// <param name="FortifiesUsed">
/// Hoeveel keer deze beurt al een <c>Fortified</c> is toegepast (FO §5.2 Kernregel: normaal
/// "één verplaatsing", met een actieve <c>FortifyUpgrade/moves</c>-rolboost meerdere — FO §8.1).
/// Afgedwongen door <see cref="Fortify.FortifyGuards.CanFortify"/> tegen
/// <see cref="Fortify.FortifyGuards.MaxMoves"/>, niet alleen geregistreerd. Start op 0 bij elke
/// nieuwe fase-intrede, want <c>PhaseChanged</c> bouwt altijd een geheel nieuwe
/// <see cref="TurnState"/> op (nooit een <c>with</c> op de oude).
/// </param>
/// <param name="HasConqueredThisTurn">
/// Of deze beurt al minstens één gebied is veroverd (FO §5.2: bepaalt of de beurt aan het
/// einde een kaart trekt). Anders dan <see cref="FortifiesUsed"/> moet deze vlag wél een
/// fase-overgang binnen dezelfde beurt overleven (Versterken → Aanvallen → Verplaatsen kunnen
/// alle drie na een verovering volgen) — <c>PhaseChanged</c>'s vouwregel zet 'm daarom expliciet
/// over vanuit de vorige <see cref="TurnState"/>, en pas terug op <see langword="false"/> zodra
/// de nieuwe fase <see cref="TurnPhase.Reinforce"/> is (een beurt begint altijd daar).
/// </param>
/// <param name="UnsettledTrades">
/// Inlegs van déze fase waarvan de opbrengst nog niet (volledig) in <see cref="ArmiesRemaining"/>
/// is opgegaan door plaatsing (FO §5.4, taak 4b: teruggedraaid bij een timeout in plaats van
/// stilzwijgend vervallen — zie <see cref="CardTradeReversal"/>). Gevuld door de
/// <c>CardsTraded</c>-vouwregel (append, meest recente laatst); leeg bij elke nieuwe
/// <see cref="TurnState"/> — net als <see cref="FortifiesUsed"/> bouwt <c>PhaseChanged</c> die
/// altijd helemaal opnieuw op, dus een voltooide fase (die <c>ArmiesRemaining == 0</c> al
/// vereist) laat hier vanzelf niets achter.
/// </param>
public sealed record TurnState(
    string ActivePlayerId,
    TurnPhase TurnPhase,
    PhaseTimer? Timer,
    PendingCombat? PendingCombat,
    AttackEngagement? PausedAttackTarget = null,
    int ArmiesRemaining = 0,
    int FortifiesUsed = 0,
    bool HasConqueredThisTurn = false,
    IReadOnlyList<UnsettledTrade>? UnsettledTrades = null)
{
    public IReadOnlyList<UnsettledTrade> UnsettledTrades { get; init; } = UnsettledTrades ?? [];
}
