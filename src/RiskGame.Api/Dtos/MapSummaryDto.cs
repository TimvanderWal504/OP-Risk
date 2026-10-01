namespace RiskGame.Api.Dtos;

/// <summary>
/// Eén kiesbare kaartvariant voor de lobby (FO §4.5, §10). De weergavenaam staat niet op de
/// draad: de frontend vertaalt die per <see cref="MapId"/>, net als gebieds- en continentnamen.
/// </summary>
/// <param name="IsDefault">De kaart die bij een nieuw spel voorgeselecteerd staat.</param>
/// <param name="DefaultStartingArmiesPresetId">De preset waarnaar de startlegers springen als de
/// host deze kaart kiest (FO §10).</param>
public sealed record MapSummaryDto(
    string MapId,
    bool IsDefault,
    int TerritoryCount,
    int ContinentCount,
    string DefaultStartingArmiesPresetId);
