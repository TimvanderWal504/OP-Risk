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

        return new GameStateDto(
            state.GameId, ToDto(state.Phase), players, availableColorIds, state.TurnOrder, territories, turnState);
    }

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
