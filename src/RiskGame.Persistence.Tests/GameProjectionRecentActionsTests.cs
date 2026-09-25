using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Tests;

/// <summary>
/// Het verloop op de TV (plan-testronde-tv punt 4): welke regel elk event oplevert, met totalen
/// en tegenpartij afgelezen uit de gevouwen state. Pure vouwregel-tests, zoals
/// <see cref="GameProjectionFoldTests"/>; het samenvoegen zelf dekt <c>RecentActionLogTests</c>.
/// </summary>
public sealed class GameProjectionRecentActionsTests
{
    private static readonly MapDefinitionSource MapSource =
        new(Path.Combine(AppContext.BaseDirectory, "data", "maps"));
    private static readonly GameProjection Projection = new(MapSource);

    private static readonly GameSettings Settings = new(
        WinCondition.WorldDomination,
        SetupMode.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: false);

    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;
    private static readonly PhaseTimer Timer = new(TimeSpan.FromMinutes(3), Now);

    /// <summary>p1 bezit brazil (5) en argentina (2), p2 bezit peru (1) en venezuela (2); de rest is onbezet.</summary>
    private static GameState BuildState(TurnPhase turnPhase = TurnPhase.Attack, GamePhase phase = GamePhase.InProgress)
    {
        var map = MapSource.Load("standaard-43");
        var owned = new Dictionary<string, (string Owner, int Armies)>
        {
            ["brazil"] = ("p1", 5),
            ["argentina"] = ("p1", 2),
            ["peru"] = ("p2", 1),
            ["venezuela"] = ("p2", 2),
        };

        var territories = map.Territories
            .Select(territory => owned.TryGetValue(territory.Id, out var entry)
                ? new TerritoryOwnership(territory.Id, entry.Owner, entry.Armies)
                : new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        return new GameState(
            "game-1",
            map,
            phase,
            Settings,
            players:
            [
                new Player("p1", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
                new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
            ],
            territories,
            turnOrder: ["p1", "p2"],
            turnState: new TurnState("p1", turnPhase, Timer, PendingCombat: null, ArmiesRemaining: 10),
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    private static CombatResolved Combat(int attackerLosses, int defenderLosses) =>
        new("game-1", "p1", "brazil", "peru", AttackerRolls: [6], DefenderRolls: [1],
            attackerLosses, defenderLosses, OccurredAtUtc: null);

    [Fact]
    public void TerritoryClaimed_LevertEenClaimRegel()
    {
        var state = Projection.Apply(BuildState(), new TerritoryClaimed("game-1", "p1", "alaska"));

        Assert.Equal(
            new RecentAction(RecentActionKind.TerritoryClaimed, Sequence: 1, PlayerId: "p1", TerritoryId: "alaska"),
            Assert.Single(state.RecentActions));
    }

    [Fact]
    public void TerritoryAssigned_DeHeleVerdeling_IsEenNeutraleRegel()
    {
        var state = BuildState();
        state = Projection.Apply(state, new TerritoryAssigned("game-1", "p1", "alaska", Guid.NewGuid()));
        state = Projection.Apply(state, new TerritoryAssigned("game-1", "p2", "alberta", Guid.NewGuid()));

        var dealt = Assert.Single(state.RecentActions);
        Assert.Equal(RecentActionKind.TerritoriesDealt, dealt.Kind);
        Assert.Null(dealt.PlayerId);
    }

    [Fact]
    public void Plaatsen_GeeftHetAantalEnHetTotaalNaAfloop()
    {
        var state = Projection.Apply(BuildState(TurnPhase.Reinforce), new ArmiesReinforced("game-1", "p1", "brazil", 3));
        state = Projection.Apply(state, new ArmiesReinforced("game-1", "p1", "brazil", 2));

        var placed = Assert.Single(state.RecentActions);
        Assert.Equal((RecentActionKind.ArmiesPlaced, 5, 10), (placed.Kind, placed.Amount, placed.Total));
    }

    [Fact]
    public void InitialArmyPlaced_IsEenLegerMetHetTotaal()
    {
        var state = Projection.Apply(BuildState(phase: GamePhase.InitialPlacement), new InitialArmyPlaced("game-1", "p1", "argentina"));

        var placed = Assert.Single(state.RecentActions);
        Assert.Equal((1, 3), (placed.Amount, placed.Total));
    }

    [Fact]
    public void PhaseChangedNaarVersterken_GeeftDeToegekendeLegers_AndereFasesNiet()
    {
        var state = BuildState();
        state = Projection.Apply(state, new PhaseChanged("game-1", "p2", TurnPhase.Reinforce, TimeSpan.FromMinutes(3), Now, ArmiesGranted: 7));
        state = Projection.Apply(state, new PhaseChanged("game-1", "p2", TurnPhase.Attack, TimeSpan.FromMinutes(3), Now, ArmiesGranted: null));

        var granted = Assert.Single(state.RecentActions);
        Assert.Equal((RecentActionKind.ReinforcementsGranted, "p2", 7), (granted.Kind, granted.PlayerId, granted.Amount));
    }

    [Fact]
    public void Kaarteninleg_GeeftDeWaarde_EnHetTerugdraaienEenEigenRegel()
    {
        var state = BuildState(TurnPhase.Reinforce).WithPlayer(
            new Player("p1", "Alice", "red", Hand: [.. MapSource.Load("standaard-43").Deck.Take(3)], RoleId: null, Mission: null, IsEliminated: false));
        var cardIds = state.Player("p1").Hand.Select(card => card.Id).ToArray();

        state = Projection.Apply(state, new CardsTraded("game-1", "p1", cardIds, SetValue: 4, OwnedTerritoryBonuses: [], NextTradeValue: 6));
        state = Projection.Apply(state, new CardTradeReverted("game-1", "p1", cardIds, SetValue: 4, OwnedTerritoryBonuses: [], RestoredTradeValue: 4));

        Assert.Equal(
            [(RecentActionKind.CardTradeReverted, 4), (RecentActionKind.CardsTraded, 4)],
            state.RecentActions.Select(action => (action.Kind, action.Amount!.Value)));
    }

    [Fact]
    public void Belegering_TeltVerliezenOp_EnNoemtDeVerdediger()
    {
        var state = BuildState().WithTerritory(new TerritoryOwnership("peru", "p2", ArmyCount: 4));
        state = Projection.Apply(state, Combat(attackerLosses: 1, defenderLosses: 1));
        state = Projection.Apply(state, Combat(attackerLosses: 0, defenderLosses: 2));

        var attack = Assert.Single(state.RecentActions);
        Assert.Equal(RecentActionKind.Attack, attack.Kind);
        Assert.Equal(("p2", "brazil", "peru", 1, 3), (attack.OtherPlayerId, attack.FromTerritoryId, attack.TerritoryId, attack.AttackerLosses, attack.DefenderLosses));
    }

    [Fact]
    public void UitschakelendeVerovering_DeMeeverplaatsingKomtOpDeVeroveringsregel_NietOpDeUitschakeling()
    {
        // Peru is het laatste gebied van p2 niet in deze opzet, maar de volgorde van de events is
        // die van een uitschakelende verovering (AttackCommandHandler): CombatResolved →
        // TerritoryConquered → PlayerEliminated, en pas later ArmiesMovedAfterConquest.
        var state = BuildState();
        state = Projection.Apply(state, Combat(attackerLosses: 0, defenderLosses: 1));
        state = Projection.Apply(state, new TerritoryConquered("game-1", "p1", "peru"));
        state = Projection.Apply(state, new PlayerEliminated("game-1", "p2", "p1"));
        state = Projection.Apply(state, new ArmiesMovedAfterConquest("game-1", "p1", "brazil", "peru", 3, Now));

        Assert.Equal(2, state.RecentActions.Count);

        var eliminated = state.RecentActions[0];
        Assert.Equal((RecentActionKind.PlayerEliminated, "p1", "p2"), (eliminated.Kind, eliminated.PlayerId, eliminated.OtherPlayerId));
        Assert.Null(eliminated.Amount);

        var conquered = state.RecentActions[1];
        Assert.Equal(RecentActionKind.Conquered, conquered.Kind);
        Assert.Equal(("p2", 0, 1, 3, 3), (conquered.OtherPlayerId, conquered.AttackerLosses, conquered.DefenderLosses, conquered.Amount, conquered.Total));
    }

    [Fact]
    public void Fortified_GeeftHetAantalEnHetTotaalOpHetDoelgebied()
    {
        var state = Projection.Apply(BuildState(TurnPhase.Fortify), new Fortified("game-1", "p1", "brazil", "argentina", 4));

        var fortified = Assert.Single(state.RecentActions);
        Assert.Equal(("brazil", "argentina", 4, 6), (fortified.FromTerritoryId, fortified.TerritoryId, fortified.Amount, fortified.Total));
    }

    [Fact]
    public void LaatsteKans_OpenenEnDoorbreken_WordenAltijdVastgelegd_ZonderMissie()
    {
        var state = BuildState();
        state = Projection.Apply(state, new PendingWinOpened("game-1", "p1", "territory-24", ["p2"]));
        state = Projection.Apply(state, new PendingWinBroken("game-1", "p1", "territory-24", "p2"));

        Assert.Equal(
            [(RecentActionKind.LastChanceBroken, "p2", (string?)"p1"), (RecentActionKind.LastChanceOpened, "p1", null)],
            state.RecentActions.Select(action => (action.Kind, action.PlayerId!, action.OtherPlayerId)));
    }

    [Fact]
    public void LobbyEnOrderRoll_LeverenGeenRegels()
    {
        var state = Projection.Create(new GameCreated("game-1", "standaard-43", Settings));
        state = Projection.Apply(state, new PlayerJoined("game-1", "p1", "Alice", IsHost: true));
        state = Projection.Apply(state, new ColorChosen("game-1", "p1", "red"));
        state = Projection.Apply(state, new TurnOrderDetermined("game-1", ["p1"]));

        Assert.Empty(state.RecentActions);
    }
}
