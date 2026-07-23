namespace RiskGame.Api.Dtos;

public sealed record CreateGameRequest(string MapId, GameSettingsDto Settings);

public sealed record CreateGameResponse(string GameId);
