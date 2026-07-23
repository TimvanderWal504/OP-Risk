namespace RiskGame.Rules.Combat;

/// <summary>
/// De legeraantallen na één gevechtsronde, en of het doelgebied daardoor is veroverd
/// (FO §5.3: het doelgebied valt zodra de verdediger nul legers overhoudt).
/// </summary>
public sealed record ConquestOutcome(int AttackerArmyCount, int DefenderArmyCount, bool Conquered);
