namespace RiskGame.Persistence.Events;

/// <summary>
/// De host heeft een nog niet gestarte, niet-host speler uit de lobby verwijderd
/// (bv. per ongeluk aangesloten, of iemand die niet meer meedoet). Alleen mogelijk
/// vóór <see cref="GameStarted"/> — zie <c>LobbyGuards.GameIsInLobby</c>.
/// </summary>
public sealed record PlayerRemoved(string GameId, string PlayerId);
