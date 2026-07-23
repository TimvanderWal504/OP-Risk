namespace RiskGame.Persistence.Events;

/// <summary>
/// Eén verplaatsing tijdens <see cref="Rules.State.TurnPhase.Fortify"/> (FO §5.2, moderne
/// variant: een aaneengesloten pad van eigen gebieden, niet beperkt tot directe buren).
/// Anders dan <see cref="ArmiesMovedAfterConquest"/> hoort hier geen gevechtsafwikkeling
/// bij — dit is een losstaande, vrije verplaatsing.
/// </summary>
public sealed record Fortified(
    string GameId, string PlayerId, string FromTerritoryId, string ToTerritoryId, int Amount);
