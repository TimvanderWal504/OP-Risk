using RiskGame.Persistence.Events;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Projections;

/// <summary>
/// Het verloop op de TV (plan-testronde-tv punt 4): welke events een regel in
/// <see cref="GameState.RecentActions"/> opleveren, allemaal op één plek. Elke <c>Record</c>
/// krijgt de state ná de eigen vouwregel van het event, zodat totalen en eigenaars alleen worden
/// afgelezen — geen spellogica (src/CLAUDE.md, event sourcing-kaders). Samenvoegen doet
/// <see cref="RecentActionLog"/>.
/// </summary>
/// <remarks>
/// Bewust zonder regel: lobby en order-roll (het verloop loopt vanaf de startopstelling), rol- en
/// missietoewijzing (privé, of vóór de start), getrokken kaarten, rolvaardigheden, het versmallen
/// van een laatste-kans-venster en het spel-einde (keuzes gebruiker 2026-09-25). De
/// gebeurtenisronde-events komen er pas bij zodra die ronde bestaat.
/// </remarks>
public sealed partial class GameProjection
{
    private static GameState Record(GameState state, TerritoryAssigned @event) =>
        Append(state, new RecentAction(RecentActionKind.TerritoriesDealt));

    private static GameState Record(GameState state, TerritoryClaimed @event) =>
        Append(state, new RecentAction(
            RecentActionKind.TerritoryClaimed, PlayerId: @event.PlayerId, TerritoryId: @event.TerritoryId));

    /// <summary>Alleen de intrede in Versterken: het begin van een beurt, en zo ook de beurtgrens voor samenvoegen.</summary>
    private static GameState Record(GameState state, PhaseChanged @event) =>
        @event is { TurnPhase: TurnPhase.Reinforce, ArmiesGranted: { } armiesGranted }
            ? Append(state, new RecentAction(
                RecentActionKind.ReinforcementsGranted, PlayerId: @event.PlayerId, Amount: armiesGranted))
            : state;

    private static GameState Record(GameState state, InitialArmyPlaced @event) =>
        RecordPlacement(state, @event.PlayerId, @event.TerritoryId, amount: 1);

    private static GameState Record(GameState state, ArmiesReinforced @event) =>
        RecordPlacement(state, @event.PlayerId, @event.TerritoryId, @event.Amount);

    private static GameState Record(GameState state, CardsTraded @event) =>
        Append(state, new RecentAction(
            RecentActionKind.CardsTraded, PlayerId: @event.PlayerId, Amount: @event.SetValue));

    private static GameState Record(GameState state, CardTradeReverted @event) =>
        Append(state, new RecentAction(
            RecentActionKind.CardTradeReverted, PlayerId: @event.PlayerId, Amount: @event.SetValue));

    /// <summary>De verdediger is nog de eigenaar: het eigendom gaat pas over bij <see cref="TerritoryConquered"/>.</summary>
    private static GameState Record(GameState state, CombatResolved @event) =>
        Append(state, new RecentAction(
            RecentActionKind.Attack,
            PlayerId: @event.PlayerId,
            OtherPlayerId: state.Territory(@event.ToTerritoryId).OwnerPlayerId,
            TerritoryId: @event.ToTerritoryId,
            FromTerritoryId: @event.FromTerritoryId,
            AttackerLosses: @event.AttackerLosses,
            DefenderLosses: @event.DefenderLosses));

    /// <summary>De lopende belegering van dit doel wordt de verovering — één regel per belegering.</summary>
    private static GameState Record(GameState state, TerritoryConquered @event) =>
        Update(
            state,
            action => action.Kind == RecentActionKind.Attack
                && action.PlayerId == @event.PlayerId
                && action.TerritoryId == @event.TerritoryId,
            action => action with { Kind = RecentActionKind.Conquered });

    /// <summary>
    /// Zoekt de verovering op in plaats van de bovenste regel te nemen: bij een uitschakelende
    /// verovering staat <see cref="PlayerEliminated"/> er al boven.
    /// </summary>
    private static GameState Record(GameState state, ArmiesMovedAfterConquest @event) =>
        Update(
            state,
            action => action.Kind == RecentActionKind.Conquered
                && action.PlayerId == @event.PlayerId
                && action.TerritoryId == @event.ToTerritoryId,
            action => action with
            {
                Amount = @event.Amount,
                Total = state.Territory(@event.ToTerritoryId).ArmyCount,
            });

    private static GameState Record(GameState state, Fortified @event) =>
        Append(state, new RecentAction(
            RecentActionKind.Fortified,
            PlayerId: @event.PlayerId,
            TerritoryId: @event.ToTerritoryId,
            FromTerritoryId: @event.FromTerritoryId,
            Amount: @event.Amount,
            Total: state.Territory(@event.ToTerritoryId).ArmyCount));

    private static GameState Record(GameState state, PlayerEliminated @event) =>
        Append(state, new RecentAction(
            RecentActionKind.PlayerEliminated,
            PlayerId: @event.EliminatedByPlayerId,
            OtherPlayerId: @event.EliminatedPlayerId));

    /// <summary>
    /// Altijd vastgelegd, ook bij de timings zonder onthulling: wat de TV mag zien, bepaalt de
    /// mapper (FO §6.2), net als bij <c>PendingWinnerPlayerId</c>. De missie zelf komt er nooit in.
    /// </summary>
    private static GameState Record(GameState state, PendingWinOpened @event) =>
        Append(state, new RecentAction(RecentActionKind.LastChanceOpened, PlayerId: @event.AchieverPlayerId));

    private static GameState Record(GameState state, PendingWinBroken @event) =>
        Append(state, new RecentAction(
            RecentActionKind.LastChanceBroken,
            PlayerId: @event.BrokenByPlayerId,
            OtherPlayerId: @event.AchieverPlayerId));

    private static GameState RecordPlacement(GameState state, string playerId, string territoryId, int amount) =>
        Append(state, new RecentAction(
            RecentActionKind.ArmiesPlaced,
            PlayerId: playerId,
            TerritoryId: territoryId,
            Amount: amount,
            Total: state.Territory(territoryId).ArmyCount));

    private static GameState Append(GameState state, RecentAction action) =>
        state.WithRecentActions(RecentActionLog.Append(state.RecentActions, action));

    private static GameState Update(
        GameState state, Func<RecentAction, bool> matches, Func<RecentAction, RecentAction> change) =>
        state.WithRecentActions(RecentActionLog.Update(state.RecentActions, matches, change));
}
