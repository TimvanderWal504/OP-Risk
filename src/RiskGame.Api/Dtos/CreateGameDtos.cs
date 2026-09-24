namespace RiskGame.Api.Dtos;

/// <param name="TvDisplay">
/// Optioneel: de TV-weergave die de host-telefoon van een vorig spel onthield (plan-testronde-tv
/// punt 2). Weglaten betekent de server-default.
/// </param>
public sealed record CreateGameRequest(string MapId, GameSettingsDto Settings, TvDisplaySettingsDto? TvDisplay = null);

public sealed record CreateGameResponse(string GameId);
