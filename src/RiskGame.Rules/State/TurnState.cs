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
/// <param name="HasFortified">
/// Of deze beurt al een <c>Fortified</c> is toegepast (FO §5.2 Kernregel: "één verplaatsing").
/// Gezet door <see cref="Fortify.FortifyGuards.CanFortify"/> afgedwongen, niet alleen
/// geregistreerd — een tweede <c>Fortify</c>-aanroep binnen dezelfde fase is ongeldig zolang dit
/// waar is. Start op <see langword="false"/> bij elke nieuwe fase-intrede, want <c>PhaseChanged</c>
/// bouwt altijd een geheel nieuwe <see cref="TurnState"/> op (nooit een <c>with</c> op de oude).
/// </param>
public sealed record TurnState(
    string ActivePlayerId,
    TurnPhase TurnPhase,
    PhaseTimer? Timer,
    PendingCombat? PendingCombat,
    AttackEngagement? PausedAttackTarget = null,
    int ArmiesRemaining = 0,
    bool HasFortified = false);
