using RiskGame.Rules.Combat;
using RiskGame.Rules.Fortify;
using RiskGame.Rules.Map;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.Roles;
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
                player.Id,
                player.Name,
                player.ColorId,
                player.RoleId,
                RoleEffects.IsActive(state, player.Id),
                AttackGuards.DefenseBoostAvailable(state, player.Id),
                player.IsHost,
                player.IsEliminated,
                player.Hand.Select(ToDto).ToArray(),
                CardSetEvaluator.HasTradeableSet(state.Map.SetRules, player.Hand),
                player.Hand.Count,
                player.Mission?.Id))
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
                    ? ToDto(
                        ReinforcementCalculator.CalculateBreakdown(state, state.TurnState.ActivePlayerId),
                        state.TurnState.UnsettledTrades.Sum(trade => trade.SetValue))
                    : null,
                Math.Max(0, FortifyGuards.MaxMoves(state, state.TurnState.ActivePlayerId) - state.TurnState.FortifiesUsed),
                (state.TurnState.TurnPhase == TurnPhase.Reinforce
                    && ReinforceGuards.MustTradeInCards(state, state.TurnState.ActivePlayerId))
                || (state.TurnState.TurnPhase == TurnPhase.Attack
                    && ReinforceGuards.MustTradeInCardsDuringAttack(state, state.TurnState.ActivePlayerId)));

        var colors = state.Map.Colors
            .Select(color => new PlayerColorDto(color.Id, color.Name, color.Hex, color.OnHex, color.Symbol))
            .ToArray();

        var roles = RolePool.EffectiveRoles(state)
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

        var pendingWinnerPlayerId = state.PendingWin is { } pendingWin
            && state.Settings.MissionWinTiming == MissionWinTiming.FullRoundRevealed
                ? pendingWin.AchieverPlayerId
                : null;

        return new GameStateDto(
            state.GameId, ToDto(state.Phase), players, availableColorIds, state.TurnOrder, territories, turnState,
            colors, roles, ToDto(state.Settings), state.Winners,
            ToDto(state.TvDisplay), ToDto(TvDisplaySettings.Default),
            state.Phase == GamePhase.OrderRoll ? new OrderRollStateDto(state.TurnOrder) : null,
            setupState, StateVersion: 0, pendingWinnerPlayerId);
    }

    /// <summary>
    /// De privacy-grens (TO §6.1, src/CLAUDE.md API-grens-kader): voor de TV-groep gaan
    /// <see cref="PlayerDto.Hand"/> en <see cref="PlayerDto.MissionId"/> van iedere speler
    /// leeg de deur uit, ook van de speler wiens beurt het is. <see cref="ToDto"/> zelf vult
    /// deze velden juist altijd volledig — dat is een eerlijke domeinvertaling, geen
    /// privacybeslissing; die hoort hier, op de enige plek waar dat wordt afgedwongen.
    ///
    /// **Uitzondering, bewust en enige:** zodra <c>Phase == Finished</c> geeft deze methode
    /// wél <see cref="PlayerDto.MissionId"/> vrij voor iedereen — FO §7 eist expliciet dat de
    /// TV bij spelwinst "de missie-onthulling van alle spelers" toont. <see cref="PlayerDto.Hand"/>
    /// blijft ook dan leeg: FO §7 vraagt om missies te onthullen, niet om kaarten te tonen.
    /// Dit was in de vorige taak al vooruitgeplande deferral (zie het toenmalige bouwplan);
    /// TO §6.1's "nooit naar de TV-groep" is hiermee bijgewerkt met deze ene, expliciete
    /// uitzondering — vóór <c>Finished</c> geldt de oorspronkelijke, onvoorwaardelijke regel
    /// onverkort.
    /// </summary>
    public static GameStateDto RedactForTv(GameStateDto dto) => dto with
    {
        Players = dto.Players
            .Select(player => player with
            {
                Hand = [],
                HasTradeableCardSet = false,
                MissionId = dto.Phase == GamePhaseDto.Finished ? player.MissionId : null,
            })
            .ToArray(),
    };

    /// <summary>
    /// Zoals <see cref="RedactForTv"/>, maar <paramref name="viewerPlayerId"/> behoudt zijn
    /// eigen <see cref="PlayerDto.Hand"/>/<see cref="PlayerDto.HasTradeableCardSet"/>/
    /// <see cref="PlayerDto.MissionId"/> — precies wat TO §6.1 bedoelt met "de publieke state
    /// plus die spelers privé-info".
    /// </summary>
    public static GameStateDto RedactForPlayer(GameStateDto dto, string viewerPlayerId) => dto with
    {
        Players = dto.Players
            .Select(player => player.Id == viewerPlayerId
                ? player
                : player with { Hand = [], HasTradeableCardSet = false, MissionId = null })
            .ToArray(),
    };

    private static CardDto ToDto(Card card) => new(card.Id, card.TerritoryId, card.Symbol);

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
        settings.EventsEnabled,
        ToDto(settings.MissionWinTiming),
        ToDto(settings.DefenseDiceRule));

    private static TvDisplaySettingsDto ToDto(TvDisplaySettings tvDisplay) => new(
        tvDisplay.TextScale, tvDisplay.GlassOpacity, tvDisplay.GlassBlur, ToDto(tvDisplay.Language));

    private static TvLanguageDto ToDto(TvLanguage language) => language switch
    {
        TvLanguage.Nl => TvLanguageDto.Nl,
        TvLanguage.En => TvLanguageDto.En,
        _ => throw new ArgumentOutOfRangeException(nameof(language), language, "Onbekende TV-taal."),
    };

    private static DefenseDiceRuleDto ToDto(DefenseDiceRule defenseDiceRule) => defenseDiceRule switch
    {
        DefenseDiceRule.HouseRule => DefenseDiceRuleDto.HouseRule,
        DefenseDiceRule.Classic => DefenseDiceRuleDto.Classic,
        _ => throw new ArgumentOutOfRangeException(nameof(defenseDiceRule), defenseDiceRule, "Onbekende dobbelregel."),
    };

    private static WinConditionDto ToDto(WinCondition winCondition) => winCondition switch
    {
        WinCondition.WorldDomination => WinConditionDto.WorldDomination,
        WinCondition.SecretMissions => WinConditionDto.SecretMissions,
        _ => throw new ArgumentOutOfRangeException(nameof(winCondition), winCondition, "Onbekende winconditie."),
    };

    private static MissionWinTimingDto ToDto(MissionWinTiming missionWinTiming) => missionWinTiming switch
    {
        MissionWinTiming.EndOfTurn => MissionWinTimingDto.EndOfTurn,
        MissionWinTiming.StartOfNextTurn => MissionWinTimingDto.StartOfNextTurn,
        MissionWinTiming.FullRoundRevealed => MissionWinTimingDto.FullRoundRevealed,
        _ => throw new ArgumentOutOfRangeException(
            nameof(missionWinTiming), missionWinTiming, "Onbekende missie-wintiming."),
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
        : new PendingCombatDto(
            pendingCombat.FromTerritoryId,
            pendingCombat.ToTerritoryId,
            pendingCombat.AttackDice,
            pendingCombat.AttackerRolls,
            pendingCombat.AwaitingRerollDecision);

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

    private static ReinforcementBreakdownDto ToDto(ReinforcementBreakdown breakdown, int cardTradeBonus) => new(
        breakdown.BaseArmies, breakdown.ContinentBonus, breakdown.RoleBonus, breakdown.EventBonus, cardTradeBonus);

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
        dto.EventsEnabled,
        ToDomain(dto.MissionWinTiming),
        ToDomain(dto.DefenseDiceRule));

    /// <summary>
    /// Een onbekende taalwaarde (bv. een getal buiten de enum, vanaf de draad) wordt bewust niet
    /// hier afgevangen maar doorgegeven: <see cref="TvDisplayGuards.ValuesAreValid"/> weigert 'm
    /// dan als gewone regelfout (<c>tvDisplay.invalidValue</c>) i.p.v. een exception.
    /// </summary>
    public static TvDisplaySettings ToDomain(TvDisplaySettingsDto dto) => new(
        dto.TextScale, dto.GlassOpacity, dto.GlassBlur, ToDomain(dto.Language));

    private static TvLanguage ToDomain(TvLanguageDto dto) => dto switch
    {
        TvLanguageDto.Nl => TvLanguage.Nl,
        TvLanguageDto.En => TvLanguage.En,
        // Ongedefinieerd doorgeven (zie doc-comment hierboven): de guard weigert het.
        _ => (TvLanguage)(int)dto,
    };

    private static DefenseDiceRule ToDomain(DefenseDiceRuleDto dto) => dto switch
    {
        DefenseDiceRuleDto.HouseRule => DefenseDiceRule.HouseRule,
        DefenseDiceRuleDto.Classic => DefenseDiceRule.Classic,
        _ => throw new ArgumentOutOfRangeException(nameof(dto), dto, "Onbekende dobbelregel."),
    };

    private static WinCondition ToDomain(WinConditionDto dto) => dto switch
    {
        WinConditionDto.WorldDomination => WinCondition.WorldDomination,
        WinConditionDto.SecretMissions => WinCondition.SecretMissions,
        _ => throw new ArgumentOutOfRangeException(nameof(dto), dto, "Onbekende winconditie."),
    };

    private static MissionWinTiming ToDomain(MissionWinTimingDto dto) => dto switch
    {
        MissionWinTimingDto.EndOfTurn => MissionWinTiming.EndOfTurn,
        MissionWinTimingDto.StartOfNextTurn => MissionWinTiming.StartOfNextTurn,
        MissionWinTimingDto.FullRoundRevealed => MissionWinTiming.FullRoundRevealed,
        _ => throw new ArgumentOutOfRangeException(nameof(dto), dto, "Onbekende missie-wintiming."),
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
