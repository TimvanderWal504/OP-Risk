namespace RiskGame.Persistence.Sessions;

/// <summary>
/// Bewijst dat een RejoinGame-aanroep daadwerkelijk van het apparaat komt dat ooit
/// JoinGame deed (TO §6.3) — losstaand van GameState/event-sourcing: dit is geen
/// spelfeit, alleen een technisch identiteitsbewijs. Id = PlayerId (al globaal uniek,
/// Guid-gebaseerd), dus een directe LoadAsync-lookup zonder aparte index nodig.
/// </summary>
public sealed record PlayerSessionToken(string Id, string GameId, string Token);
