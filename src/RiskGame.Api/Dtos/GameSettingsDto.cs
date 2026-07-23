namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.State.GameSettings"/> (FO §10) —
/// eigen enums in plaats van de domein-enums, zodat het domein los blijft van de
/// draadindeling (src/CLAUDE.md, API-grens-kader).
/// </summary>
public sealed record GameSettingsDto(
    WinConditionDto WinCondition,
    SetupModeDto SetupMode,
    int StartingArmies,
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
