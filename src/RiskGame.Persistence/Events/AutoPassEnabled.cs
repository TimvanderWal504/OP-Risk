namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler staat vanaf nu op auto-pass (FO §11.2): de server speelt zijn beurt, verdediging en
/// legerverlies-keuze. Wat er direct voor hem wordt afgehandeld (verdediging, attrition, een
/// afgebroken eigen beurt) volgt als gewone events in dezelfde batch; dit event zet alleen
/// <see cref="Rules.State.Player.IsAutoPass"/>.
/// </summary>
public sealed record AutoPassEnabled(string GameId, string PlayerId, AutoPassReason Reason);
