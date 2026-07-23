namespace RiskGame.Persistence.Events;

/// <summary>
/// De aanvaller heeft na verovering legers meeverplaatst naar het veroverde gebied
/// (FO §5.3 stap 6, commando <c>MoveAfterConquest</c> uit TO §4.1). Dit is ook het moment
/// waarop het gevecht volledig is afgehandeld (FO §5.4): de vouwregel zet
/// <see cref="Rules.State.TurnState.PendingCombat"/> terug naar <c>null</c> en hervat de
/// beurttimer.
/// </summary>
public sealed record ArmiesMovedAfterConquest(
    string GameId, string PlayerId, string FromTerritoryId, string ToTerritoryId, int Amount);
