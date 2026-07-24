using RiskGame.Rules.State;

namespace RiskGame.Api.Dtos;

/// <summary>
/// Expliciete mapping tussen domeintypes en draad-DTO's — nooit een domeintype
/// rechtstreeks serialiseren (src/CLAUDE.md, API-grens-kader).
/// </summary>
public static class GameStateDtoMapper
{
    public static GameStateDto ToDto(GameState state)
    {
        var takenColorIds = state.Players
            .Where(player => player.ColorId is not null)
            .Select(player => player.ColorId!)
            .ToHashSet();

        var availableColorIds = state.Map.Colors
            .Select(color => color.Id)
            .Where(colorId => !takenColorIds.Contains(colorId))
            .ToArray();

        var players = state.Players
            .Select(player => new PlayerDto(
                player.Id, player.Name, player.ColorId, player.RoleId, player.IsHost, player.IsEliminated))
            .ToArray();

        var territories = state.Territories
            .Select(territory => new TerritoryDto(territory.TerritoryId, territory.OwnerPlayerId, territory.ArmyCount))
            .ToArray();

        var turnState = state.TurnState is null
            ? null
            : new TurnStateDto(
                state.TurnState.ActivePlayerId,
                ToDto(state.TurnState.TurnPhase),
                state.TurnState.ArmiesRemaining,
                ToDto(state.TurnState.PendingCombat));

        var colors = state.Map.Colors
            .Select(color => new PlayerColorDto(color.Id, color.Name, color.Hex, color.Symbol))
            .ToArray();

        var roles = state.Map.Roles
            .Select(role => new RoleSummaryDto(role.Id, role.Name, role.Description))
            .ToArray();

        return new GameStateDto(
            state.GameId, ToDto(state.Phase), players, availableColorIds, state.TurnOrder, territories, turnState,
            colors, roles, ToDto(state.Settings));
    }

    private static GameSettingsDto ToDto(GameSettings settings) => new(
        ToDto(settings.WinCondition),
        ToDto(settings.SetupMode),
        settings.StartingArmies,
        (int)settings.TurnTimer.TotalSeconds,
        (int)settings.FortifyTimer.TotalSeconds,
        settings.RolesEnabled,
        ToDto(settings.RoleAssignment),
        settings.EventsEnabled);

    private static WinConditionDto ToDto(WinCondition winCondition) => winCondition switch
    {
        WinCondition.WorldDomination => WinConditionDto.WorldDomination,
        WinCondition.SecretMissions => WinConditionDto.SecretMissions,
        _ => throw new ArgumentOutOfRangeException(nameof(winCondition), winCondition, "Onbekende winconditie."),
    };

    private static SetupModeDto ToDto(SetupMode setupMode) => setupMode switch
    {
        SetupMode.Random => SetupModeDto.Random,
        SetupMode.Claiming => SetupModeDto.Claiming,
        _ => throw new ArgumentOutOfRangeException(nameof(setupMode), setupMode, "Onbekende opstelmodus."),
    };

    private static RoleAssignmentModeDto ToDto(RoleAssignmentMode roleAssignment) => roleAssignment switch
    {
        RoleAssignmentMode.Random => RoleAssignmentModeDto.Random,
        RoleAssignmentMode.Choose => RoleAssignmentModeDto.Choose,
        _ => throw new ArgumentOutOfRangeException(nameof(roleAssignment), roleAssignment, "Onbekende roltoewijzing."),
    };

    private static PendingCombatDto? ToDto(PendingCombat? pendingCombat) => pendingCombat is null
        ? null
        : new PendingCombatDto(pendingCombat.FromTerritoryId, pendingCombat.ToTerritoryId, pendingCombat.AttackDice);

    private static TurnPhaseDto ToDto(TurnPhase turnPhase) => turnPhase switch
    {
        TurnPhase.Reinforce => TurnPhaseDto.Reinforce,
        TurnPhase.Attack => TurnPhaseDto.Attack,
        TurnPhase.Fortify => TurnPhaseDto.Fortify,
        _ => throw new ArgumentOutOfRangeException(nameof(turnPhase), turnPhase, "Onbekende beurtfase."),
    };

    private static GamePhaseDto ToDto(GamePhase phase) => phase switch
    {
        GamePhase.Lobby => GamePhaseDto.Lobby,
        GamePhase.OrderRoll => GamePhaseDto.OrderRoll,
        GamePhase.Claiming => GamePhaseDto.Claiming,
        GamePhase.InitialPlacement => GamePhaseDto.InitialPlacement,
        GamePhase.InProgress => GamePhaseDto.InProgress,
        GamePhase.Finished => GamePhaseDto.Finished,
        _ => throw new ArgumentOutOfRangeException(nameof(phase), phase, "Onbekende spelfase."),
    };

    public static GameSettings ToDomain(GameSettingsDto dto) => new(
        ToDomain(dto.WinCondition),
        ToDomain(dto.SetupMode),
        dto.StartingArmies,
        TimeSpan.FromSeconds(dto.TurnTimerSeconds),
        TimeSpan.FromSeconds(dto.FortifyTimerSeconds),
        dto.RolesEnabled,
        ToDomain(dto.RoleAssignment),
        dto.EventsEnabled);

    private static WinCondition ToDomain(WinConditionDto dto) => dto switch
    {
        WinConditionDto.WorldDomination => WinCondition.WorldDomination,
        WinConditionDto.SecretMissions => WinCondition.SecretMissions,
        _ => throw new ArgumentOutOfRangeException(nameof(dto), dto, "Onbekende winconditie."),
    };

    private static SetupMode ToDomain(SetupModeDto dto) => dto switch
    {
        SetupModeDto.Random => SetupMode.Random,
        SetupModeDto.Claiming => SetupMode.Claiming,
        _ => throw new ArgumentOutOfRangeException(nameof(dto), dto, "Onbekende opstelmodus."),
    };

    private static RoleAssignmentMode ToDomain(RoleAssignmentModeDto dto) => dto switch
    {
        RoleAssignmentModeDto.Random => RoleAssignmentMode.Random,
        RoleAssignmentModeDto.Choose => RoleAssignmentMode.Choose,
        _ => throw new ArgumentOutOfRangeException(nameof(dto), dto, "Onbekende roltoewijzing."),
    };
}
