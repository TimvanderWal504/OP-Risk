using RiskGame.Rules.Fortify;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Dtos;

/// <summary>
/// Expliciete mapping tussen domeintypes en draad-DTO's — nooit een domeintype
/// rechtstreeks serialiseren (src/CLAUDE.md, API-grens-kader).
/// </summary>
public static class GameStateDtoMapper
{
    /// <summary>
    /// <paramref name="timeProvider"/> is verplicht (geen intern <c>DateTimeOffset.UtcNow</c>)
    /// zodat <see cref="TurnTimerDto.RemainingMs"/> deterministisch en testbaar blijft — zelfde
    /// patroon als <see cref="RiskGame.Api.Services.TurnTimerBackgroundService"/>.
    /// </summary>
    public static GameStateDto ToDto(GameState state, TimeProvider timeProvider)
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
                ToDto(state.TurnState.PendingCombat),
                ToDto(state.TurnState.Timer, timeProvider),
                state.TurnState.TurnPhase == TurnPhase.Fortify
                    ? FortifyGuards.ReachableComponents(state, state.TurnState.ActivePlayerId)
                    : [],
                state.TurnState.TurnPhase == TurnPhase.Reinforce
                    ? ToDto(ReinforcementCalculator.CalculateBreakdown(state, state.TurnState.ActivePlayerId))
                    : null,
                state.TurnState.HasFortified);

        var colors = state.Map.Colors
            .Select(color => new PlayerColorDto(color.Id, color.Name, color.Hex, color.OnHex, color.Symbol))
            .ToArray();

        var roles = state.Map.Roles
            .Select(role => new RoleSummaryDto(role.Id, role.Name, role.Description, role.OriginTerritory))
            .ToArray();

        // StartingArmiesResolver vereist een definitief spelersaantal (2–7, zie de preset-
        // tabel) — pas betekenisvol vanaf Claiming/InitialPlacement, dus alleen daar berekend
        // (in Lobby staat het aantal nog niet vast, vaak nog maar 1 speler).
        SetupStateDto? setupState = null;

        if (state.Phase is GamePhase.Claiming or GamePhase.InitialPlacement)
        {
            var startingArmies = StartingArmiesResolver.Resolve(state);
            var activePlayerId = state.Phase == GamePhase.Claiming
                ? SetupTurnCalculator.ActiveClaimerId(state)
                : SetupTurnCalculator.ActivePlacerId(state, startingArmies);

            setupState = ToSetupDto(state, activePlayerId, startingArmies);
        }

        return new GameStateDto(
            state.GameId, ToDto(state.Phase), players, availableColorIds, state.TurnOrder, territories, turnState,
            colors, roles, ToDto(state.Settings),
            state.Phase == GamePhase.OrderRoll ? new OrderRollStateDto(state.TurnOrder) : null,
            setupState);
    }

    /// <summary>
    /// Vult de setup-afleidingen per speler, met dezelfde calculators en guards die de
    /// commando's valideren — zo kan wat de client toont niet uit de pas lopen met wat de
    /// server accepteert.
    /// </summary>
    private static SetupStateDto ToSetupDto(GameState state, string? activePlayerId, int startingArmies) => new(
        activePlayerId,
        state.Players.ToDictionary(
            player => player.Id,
            player => SetupTurnCalculator.RemainingArmiesFor(state, player.Id, startingArmies)),
        state.Players.ToDictionary(
            player => player.Id,
            player => SetupGuards.ClaimableTerritoryIdsFor(state, player.Id)));

    private static GameSettingsDto ToDto(GameSettings settings) => new(
        ToDto(settings.WinCondition),
        ToDto(settings.SetupMode),
        settings.StartingArmiesPresetId,
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

    /// <summary>
    /// <c>Remaining − (nu − LastUpdatedUtc)</c>, geklemd op 0 (zie doc-comment op
    /// <see cref="TurnTimerDto"/>). Bij <see cref="PhaseTimer.IsPaused"/> telt niets af:
    /// <see cref="PhaseTimer.Remaining"/> ligt dan al vast, ongeacht hoe lang geleden dat was.
    /// </summary>
    private static TurnTimerDto? ToDto(PhaseTimer? timer, TimeProvider timeProvider)
    {
        if (timer is null)
        {
            return null;
        }

        var remaining = timer.IsPaused
            ? timer.Remaining
            : timer.Remaining - (timeProvider.GetUtcNow() - timer.LastUpdatedUtc);

        var remainingMs = (int)Math.Max(0, remaining.TotalMilliseconds);

        return new TurnTimerDto(remainingMs, timer.IsPaused);
    }

    private static ReinforcementBreakdownDto ToDto(ReinforcementBreakdown breakdown) => new(
        breakdown.BaseArmies, breakdown.ContinentBonus, breakdown.RoleBonus, breakdown.EventBonus);

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
        dto.StartingArmiesPresetId,
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
