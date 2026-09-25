using RiskGame.Api.Dtos;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Het verloop op de TV (plan-testronde-tv punt 4): de mapper zet elke regel 1-op-1 over, en laat
/// het laatste-kans-venster alleen door bij "Volle ronde met onthulling" (FO §6.2). Pure
/// mapper-tests: geen hub of database nodig.
/// </summary>
public sealed class GameStateDtoMapperRecentActionsTests
{
    private static readonly MapDefinition Map =
        new MapDefinitionSource(Path.Combine(AppContext.BaseDirectory, "data", "maps")).Load("standaard-43");

    private static GameState State(MissionWinTiming timing, params RecentAction[] newestFirst)
    {
        var settings = new GameSettings(
            WinCondition.SecretMissions,
            SetupMode.Claiming,
            StartingArmiesPresetId: "classic",
            TurnTimer: TimeSpan.FromMinutes(3),
            FortifyTimer: TimeSpan.FromMinutes(1),
            RolesEnabled: false,
            RoleAssignment: RoleAssignmentMode.Random,
            EventsEnabled: false,
            MissionWinTiming: timing);

        return new GameState(
            "recent-actions",
            Map,
            GamePhase.InProgress,
            settings,
            players:
            [
                new Player("alice", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
                new Player("bob", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
            ],
            territories: Map.Territories
                .Select(territory => new TerritoryOwnership(territory.Id, "alice", ArmyCount: 1))
                .ToArray(),
            turnOrder: ["alice", "bob"],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: [],
            recentActions: newestFirst);
    }

    /// <summary>Per soort precies de velden die de projectie vult — een veld dat nooit gevuld wordt, valt zo op.</summary>
    public static TheoryData<RecentAction> EveryKind() =>
    [
        new(RecentActionKind.TerritoriesDealt, 1),
        new(RecentActionKind.TerritoryClaimed, 2, PlayerId: "alice", TerritoryId: "alaska"),
        new(RecentActionKind.ReinforcementsGranted, 3, PlayerId: "alice", Amount: 7),
        new(RecentActionKind.ArmiesPlaced, 4, PlayerId: "alice", TerritoryId: "alaska", Amount: 3, Total: 8),
        new(RecentActionKind.CardsTraded, 5, PlayerId: "alice", Amount: 6),
        new(RecentActionKind.CardTradeReverted, 6, PlayerId: "alice", Amount: 6),
        new(RecentActionKind.Attack, 7, PlayerId: "alice", OtherPlayerId: "bob", TerritoryId: "alberta",
            FromTerritoryId: "alaska", AttackerLosses: 1, DefenderLosses: 2),
        new(RecentActionKind.Conquered, 8, PlayerId: "alice", OtherPlayerId: "bob", TerritoryId: "alberta",
            FromTerritoryId: "alaska", Amount: 3, Total: 3, AttackerLosses: 0, DefenderLosses: 2),
        new(RecentActionKind.Fortified, 9, PlayerId: "alice", TerritoryId: "alaska", FromTerritoryId: "alberta",
            Amount: 2, Total: 5),
        new(RecentActionKind.PlayerEliminated, 10, PlayerId: "alice", OtherPlayerId: "bob"),
        new(RecentActionKind.LastChanceOpened, 11, PlayerId: "alice"),
        new(RecentActionKind.LastChanceBroken, 12, PlayerId: "bob", OtherPlayerId: "alice"),
    ];

    [Theory]
    [MemberData(nameof(EveryKind))]
    public void ElkeSoort_WordtVeldVoorVeldOvergezet(RecentAction action)
    {
        var dto = GameStateDtoMapper.ToDto(State(MissionWinTiming.FullRoundRevealed, action), TimeProvider.System);

        var mapped = Assert.Single(dto.RecentActions);
        Assert.Equal(action.Kind.ToString(), mapped.Kind.ToString());
        Assert.Equal(
            (action.Sequence, action.PlayerId, action.OtherPlayerId, action.TerritoryId, action.FromTerritoryId,
                action.Amount, action.Total, action.AttackerLosses, action.DefenderLosses),
            (mapped.Sequence, mapped.PlayerId, mapped.OtherPlayerId, mapped.TerritoryId, mapped.FromTerritoryId,
                mapped.Amount, mapped.Total, mapped.AttackerLosses, mapped.DefenderLosses));
    }

    [Fact]
    public void ElkeSoort_HeeftEenDraadTegenhanger()
    {
        Assert.Equal(
            Enum.GetNames<RecentActionKind>(),
            Enum.GetNames<RecentActionKindDto>());
    }

    [Theory]
    [InlineData(MissionWinTiming.EndOfTurn)]
    [InlineData(MissionWinTiming.StartOfNextTurn)]
    public void LaatsteKans_ZonderOnthulling_BlijftVerborgen_DeRestNiet(MissionWinTiming timing)
    {
        var state = State(
            timing,
            new RecentAction(RecentActionKind.LastChanceBroken, 3, PlayerId: "bob", OtherPlayerId: "alice"),
            new RecentAction(RecentActionKind.LastChanceOpened, 2, PlayerId: "alice"),
            new RecentAction(RecentActionKind.CardsTraded, 1, PlayerId: "alice", Amount: 4));

        var dto = GameStateDtoMapper.ToDto(state, TimeProvider.System);

        Assert.Equal(RecentActionKindDto.CardsTraded, Assert.Single(dto.RecentActions).Kind);
    }

    [Fact]
    public void LaatsteKans_MetOnthulling_IsZichtbaar()
    {
        var state = State(
            MissionWinTiming.FullRoundRevealed,
            new RecentAction(RecentActionKind.LastChanceOpened, 1, PlayerId: "alice"));

        var dto = GameStateDtoMapper.ToDto(state, TimeProvider.System);

        Assert.Equal(RecentActionKindDto.LastChanceOpened, Assert.Single(dto.RecentActions).Kind);
    }
}
