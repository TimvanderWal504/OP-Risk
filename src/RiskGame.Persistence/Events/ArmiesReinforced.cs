namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler heeft <paramref name="Amount"/> legers geplaatst tijdens
/// <see cref="Rules.State.TurnPhase.Reinforce"/> (FO §5.2, commando <c>PlaceArmies</c>
/// uit TO §4.1). Anders dan <see cref="InitialArmyPlaced"/> — dat altijd 1 leger per
/// keer plaatst tijdens de startopstelling — staat het commando hier een aantal ineens
/// toe, dus draagt dit event dat aantal expliciet mee.
/// </summary>
public sealed record ArmiesReinforced(string GameId, string PlayerId, string TerritoryId, int Amount);
