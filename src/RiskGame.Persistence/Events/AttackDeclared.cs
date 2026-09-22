namespace RiskGame.Persistence.Events;

/// <summary>
/// De aanvaller drukt "Gooi" — dit is tegelijk de bevestiging van de aanval (FO §5.3
/// stap 2, commando <c>DeclareAttack</c> uit TO §4.1). Zet <see cref="Rules.State.TurnState.PendingCombat"/>
/// en pauzeert de lopende beurttimer (FO §5.4): uitgevoerde aanvallen kosten de aanvaller
/// zo geen beurttijd.
/// </summary>
/// <param name="AttackerRolls">
/// De aanvalsworp, aflopend gesorteerd — leidend voor <see cref="Rules.State.PendingCombat.AttackerRolls"/>
/// (plan-rollen C1/C6). Hernoemd naar <c>attack_declared_v2</c> (<c>GameStoreFactory</c>) omdat
/// dit veld en <see cref="AwaitingRerollDecision"/> hier zijn bijgekomen: een oude stream mist
/// ze en hoort weggegooid te worden (TO §5-beleid, geen upcast).
/// </param>
/// <param name="AwaitingRerollDecision">
/// Of de aanvaller — vóór het bepalen van dit event al bekend via
/// <c>Rules.Combat.AttackGuards.RerollAvailable</c> — nog moet kiezen tussen "Herwerp" en
/// "Doorgaan" (FO §5.3 stap 3, §8.1, plan-rollen C2). Door de commandhandler bepaald, niet door
/// deze vouwregel: die kopieert de uitkomst alleen naar <see cref="Rules.State.PendingCombat"/>.
/// </param>
/// <param name="Remaining">
/// De resterende tijd van de beurttimer op het moment van pauzeren, bevroren tot een
/// hervattend event (<see cref="CombatResolved"/> of <see cref="ArmiesMovedAfterConquest"/>)
/// volgt. Berekend door de command handler met haar eigen klok, niet door de engine zelf
/// (zie <see cref="Rules.State.PhaseTimer"/>).
/// </param>
/// <param name="OccurredAtUtc">Tijdstip waarop <paramref name="Remaining"/> is vastgesteld.</param>
/// <param name="CorrelationId">
/// Zie <see cref="Rules.State.PendingCombat.CorrelationId"/> — gegenereerd door de command
/// handler (geen speluitkomst, dus buiten de <c>IRandomSource</c>-determinismeplicht van
/// <c>RiskGame.Rules</c>) en vanaf hier meegedragen tot en met het combat-narratief-event.
/// </param>
public sealed record AttackDeclared(
    string GameId,
    string PlayerId,
    string FromTerritoryId,
    string ToTerritoryId,
    int AttackDice,
    IReadOnlyList<int> AttackerRolls,
    bool AwaitingRerollDecision,
    TimeSpan Remaining,
    DateTimeOffset OccurredAtUtc,
    Guid CorrelationId);
