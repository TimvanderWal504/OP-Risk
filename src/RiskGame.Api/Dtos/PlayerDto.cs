namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van een speler. <see cref="RoleId"/> is openbaar (FO §8: rollen
/// staan permanent op de TV) en dus altijd meegestuurd. <see cref="Hand"/>,
/// <see cref="HasTradeableCardSet"/> en <see cref="MissionId"/> zijn de privé velden (TO §6.1):
/// <see cref="GameStateDtoMapper.ToDto"/> vult ze voor iedere speler, maar de push-composer
/// (<see cref="GameStateDtoMapper.RedactForTv"/>/<see cref="GameStateDtoMapper.RedactForPlayer"/>,
/// gebruikt door <c>GameStatePush</c>) leegt ze voor elke speler behalve de ontvanger zelf
/// vóórdat er iets over de draad gaat — dat is de enige plek waar deze privacy-grens wordt
/// afgedwongen. <see cref="HasTradeableCardSet"/> gaat mee in dezelfde redactie als
/// <see cref="Hand"/>: de vlag is rechtstreeks van de hand afgeleid, dus zou zonder redactie
/// alsnog iets over een andere speler's hand verklappen — inhoudelijk is het of er ergens in
/// <see cref="Hand"/> een geldige inlegset zit (FO §4.4,
/// <see cref="RiskGame.Rules.Reinforcement.CardSetEvaluator.HasTradeableSet"/>); de telefoon
/// gebruikt dit om de "Leg kaarten in"-knop te tonen zonder de setregels zelf na te bouwen
/// (frontend/CLAUDE.md: geen spelregels in TypeScript). <see cref="HandCount"/> is bewust
/// anders: FO §7 maakt het aantal kaarten expliciet publiek ("Hand-aantal van elke speler is
/// publiek, de kaarten zelf niet"), dus dat veld blijft ongemoeid buiten beide redactiemethodes
/// — zelfde openbare behandeling als <see cref="RoleId"/>.
/// </summary>
public sealed record PlayerDto(
    string Id,
    string Name,
    string? ColorId,
    string? RoleId,
    bool IsHost,
    bool IsEliminated,
    IReadOnlyList<CardDto> Hand,
    bool HasTradeableCardSet,
    int HandCount,
    string? MissionId);
