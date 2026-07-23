namespace RiskGame.Persistence.Events;

/// <summary>
/// De aanvaller drukt "Gooi" — dit is tegelijk de bevestiging van de aanval (FO §5.3
/// stap 2, commando <c>DeclareAttack</c> uit TO §4.1). Zet <see cref="Rules.State.TurnState.PendingCombat"/>
/// en pauzeert de lopende beurttimer (FO §5.4): uitgevoerde aanvallen kosten de aanvaller
/// zo geen beurttijd.
/// </summary>
public sealed record AttackDeclared(
    string GameId, string PlayerId, string FromTerritoryId, string ToTerritoryId, int AttackDice);
