namespace RiskGame.Persistence.Events;

/// <summary>
/// De aanvaller drukt "Gooi" — dit is tegelijk de bevestiging van de aanval (FO §5.3
/// stap 2, commando <c>DeclareAttack</c> uit TO §4.1). Zet <see cref="Rules.State.TurnState.PendingCombat"/>
/// en pauzeert de lopende beurttimer (FO §5.4): uitgevoerde aanvallen kosten de aanvaller
/// zo geen beurttijd.
/// </summary>
/// <param name="Remaining">
/// De resterende tijd van de beurttimer op het moment van pauzeren, bevroren tot een
/// hervattend event (<see cref="CombatResolved"/> of <see cref="ArmiesMovedAfterConquest"/>)
/// volgt. Berekend door de command handler met haar eigen klok, niet door de engine zelf
/// (zie <see cref="Rules.State.PhaseTimer"/>).
/// </param>
/// <param name="OccurredAtUtc">Tijdstip waarop <paramref name="Remaining"/> is vastgesteld.</param>
public sealed record AttackDeclared(
    string GameId,
    string PlayerId,
    string FromTerritoryId,
    string ToTerritoryId,
    int AttackDice,
    TimeSpan Remaining,
    DateTimeOffset OccurredAtUtc);
