namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van een speler. <see cref="RoleId"/> is openbaar (FO §8: rollen
/// staan permanent op de TV) en dus altijd meegestuurd. <see cref="Hand"/> en
/// <see cref="MissionId"/> zijn de twee privé velden (TO §6.1): <see cref="GameStateDtoMapper.ToDto"/>
/// vult ze voor iedere speler, maar de push-composer (<see cref="GameStateDtoMapper.RedactForTv"/>/
/// <see cref="GameStateDtoMapper.RedactForPlayer"/>, gebruikt door <c>GameStatePush</c>) leegt ze
/// voor elke speler behalve de ontvanger zelf vóórdat er iets over de draad gaat — dat is de enige
/// plek waar deze privacy-grens wordt afgedwongen.
/// </summary>
public sealed record PlayerDto(
    string Id,
    string Name,
    string? ColorId,
    string? RoleId,
    bool IsHost,
    bool IsEliminated,
    IReadOnlyList<CardDto> Hand,
    string? MissionId);
