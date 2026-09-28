using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Het opbouwpaneel (<see cref="ReinforcementBreakdownDto"/>) wordt tijdens Versterken live
/// berekend. Een gebeurtenisbonus (FO §9.2) moet daar de hele beurt in staan en optellen tot de
/// toegekende pool — ook nadat de beurtstart gevouwen is. Pure mapper-test op een gevouwen state:
/// geen hub of database nodig.
/// </summary>
public sealed class GameStateDtoMapperEventBonusTests
{
    private static readonly MapDefinitionSource MapSource = new(Path.Combine(AppContext.BaseDirectory, "data", "maps"));
    private static readonly GameProjection Projection = new(MapSource);

    private static readonly GameSettings Settings = new(
        WinCondition.WorldDomination,
        SetupMode.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: true);

    private static GameState NaTrekkingVanBabyboom()
    {
        var map = MapSource.Load("standaard-43");

        var state = new GameState(
            "game-bonus",
            map,
            GamePhase.InProgress,
            Settings,
            players:
            [
                new Player("alice", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
                new Player("bob", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
            ],
            territories: map.Territories
                .Select(territory => new TerritoryOwnership(territory.Id, "bob", ArmyCount: 1))
                .ToArray(),
            turnOrder: ["alice", "bob"],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);

        return Projection.Apply(
            state, new EffectApplied("game-bonus", "babyboom", new Dictionary<string, int> { ["alice"] = 2, ["bob"] = 2 }));
    }

    [Fact]
    public void Opbouwpaneel_TijdensVersterken_ToontDeGebeurtenisbonusEnKloptMetDePool()
    {
        // Alice heeft geen gebieden: basis 3 + gebeurtenisbonus 2.
        var state = Projection.Apply(
            NaTrekkingVanBabyboom(),
            new PhaseChanged("game-bonus", "alice", TurnPhase.Reinforce, Settings.TurnTimer, DateTimeOffset.UtcNow, ArmiesGranted: 5));

        var breakdown = GameStateDtoMapper.ToDto(state, TimeProvider.System).TurnState!.ReinforcementBreakdown!;

        Assert.Equal(2, breakdown.EventBonus);
        Assert.Equal(5, breakdown.BaseArmies + breakdown.ContinentBonus + breakdown.RoleBonus + breakdown.EventBonus);
        Assert.Equal(5, state.TurnState!.ArmiesRemaining);
    }

    [Fact]
    public void NaHetEindeVanDeBeurt_IsDeBonusGeind_AlleenVoorDieSpeler()
    {
        var state = Projection.Apply(
            Projection.Apply(
                NaTrekkingVanBabyboom(),
                new PhaseChanged("game-bonus", "alice", TurnPhase.Reinforce, Settings.TurnTimer, DateTimeOffset.UtcNow, ArmiesGranted: 5)),
            new TurnEnded("game-bonus", "alice"));

        Assert.Equal(0, state.Player("alice").PendingEventBonus);
        Assert.Equal(2, state.Player("bob").PendingEventBonus);
    }
}
