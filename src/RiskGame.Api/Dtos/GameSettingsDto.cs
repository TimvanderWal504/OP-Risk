namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.State.GameSettings"/> (FO §10) —
/// eigen enums in plaats van de domein-enums, zodat het domein los blijft van de
/// draadindeling (src/CLAUDE.md, API-grens-kader).
/// </summary>
public sealed record GameSettingsDto(
    WinConditionDto WinCondition,
    SetupModeDto SetupMode,
    string StartingArmiesPresetId,
    int TurnTimerSeconds,
    int FortifyTimerSeconds,
    bool RolesEnabled,
    RoleAssignmentModeDto RoleAssignment,
    bool EventsEnabled);

public enum WinConditionDto
{
    WorldDomination,
    SecretMissions,
}

public enum SetupModeDto
{
    Random,
    Claiming,
}

public enum RoleAssignmentModeDto
{
    Random,
    Choose,
}

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.Map.StartingArmiesPreset"/> (FO §5.1/§10)
/// — de client kiest hieruit een <c>Id</c> voor <see cref="GameSettingsDto.StartingArmiesPresetId"/>;
/// namen/beschrijvingen per preset-id zijn client-side i18n, niet hier.
/// </summary>
public sealed record StartingArmiesPresetDto(string Id, IReadOnlyDictionary<int, int> ArmiesByPlayerCount);
