using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Tests;

/// <summary>
/// Directe eenheidstests op <see cref="GameProjection"/>'s vouwregels — geen Postgres/
/// Testcontainers nodig, anders dan <see cref="GameProjectionRoundTripTests"/>: een vouwregel
/// is een pure <see cref="GameState"/>-transformatie, dus om die te bewijzen hoeft niet de hele
/// opslag-/replay-pijplijn opgetuigd te worden. Dekt de scenario's uit docs/plan-rollen.md taak 3
/// (rol-herwerp): per doelgebied per beurt, "Doorgaan" verbruikt niets (A8), een ander doelgebied
/// krijgt zijn eigen herwerp (A7), en een dubbele beslissing is een no-op (C8).
/// </summary>
public sealed class GameProjectionFoldTests
{
    private static readonly string MapsRoot = Path.Combine(AppContext.BaseDirectory, "data", "maps");
    private static readonly MapDefinitionSource MapSource = new(MapsRoot);
    private static readonly GameProjection Projection = new(MapSource);

    private static readonly GameSettings RoleSettings = new(
        WinCondition.WorldDomination,
        SetupMode.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: true,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: false);

    /// <summary>"generaal" (Reroll-effect, herkomstland "china") actief voor p1 — voldoende voor
    /// alle vouwregels hieronder, die zelf geen rol-activiteit toetsen (dat doet de guard/
    /// commandhandler al vóór het event ontstaat, plan-rollen C2); alleen territoria die de
    /// tests aanraken krijgen een expliciete eigenaar, de rest blijft onbezet.</summary>
    private static GameState BuildState(TurnState turnState)
    {
        var map = MapSource.Load("standaard-43");
        var owned = new Dictionary<string, string> { ["china"] = "p1", ["alaska"] = "p1", ["alberta"] = "p2", ["ontario"] = "p2" };

        var territories = map.Territories
            .Select(territory => owned.TryGetValue(territory.Id, out var ownerId)
                ? new TerritoryOwnership(territory.Id, ownerId, ArmyCount: 3)
                : new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var alice = new Player("p1", "Alice", "red", Hand: [], RoleId: "generaal", Mission: null, IsEliminated: false);
        var bob = new Player("p2", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false);

        return new GameState(
            "game-1",
            map,
            GamePhase.InProgress,
            RoleSettings,
            players: [alice, bob],
            territories,
            turnOrder: ["p1", "p2"],
            turnState,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    private static readonly PhaseTimer Timer = new(TimeSpan.FromMinutes(3), DateTimeOffset.UtcNow);
    private static readonly Guid CorrelationId = Guid.NewGuid();

    private static TurnState AttackTurnState(
        PendingCombat? pendingCombat = null, IReadOnlyList<string>? rerolledTargetTerritoryIds = null) =>
        new("p1", TurnPhase.Attack, Timer, pendingCombat, RerolledTargetTerritoryIds: rerolledTargetTerritoryIds);

    [Fact]
    public void AttackDeclared_KopieertDeWorpEnDeHerwerpVlagNaarPendingCombat()
    {
        var state = BuildState(AttackTurnState());

        var folded = Projection.Apply(
            state,
            new AttackDeclared(
                "game-1", "p1", "alaska", "alberta", AttackDice: 2,
                AttackerRolls: [5, 3], AwaitingRerollDecision: true,
                Remaining: TimeSpan.FromMinutes(3), OccurredAtUtc: DateTimeOffset.UtcNow, CorrelationId));

        Assert.Equal([5, 3], folded.TurnState!.PendingCombat!.AttackerRolls);
        Assert.True(folded.TurnState.PendingCombat.AwaitingRerollDecision);
    }

    [Fact]
    public void AttackDieRerolled_VervangtDeWorpEnVoegtDoelgebiedToeAanRerolledTargets()
    {
        var pendingCombat = new PendingCombat("alaska", "alberta", AttackDice: 2, AttackerRolls: [4, 2], AwaitingRerollDecision: true, CorrelationId);
        var state = BuildState(AttackTurnState(pendingCombat));

        var folded = Projection.Apply(
            state, new AttackDieRerolled("game-1", "p1", "alberta", PreviousRolls: [4, 2], RerolledDieIndex: 1, NewValue: 6, Rolls: [6, 4]));

        Assert.Equal([6, 4], folded.TurnState!.PendingCombat!.AttackerRolls);
        Assert.False(folded.TurnState.PendingCombat.AwaitingRerollDecision);
        Assert.Equal(["alberta"], folded.TurnState.RerolledTargetTerritoryIds);
    }

    [Fact]
    public void AttackDiceKept_SluitDeBeslissing_ZonderRerolledTargetsAanTeVullen()
    {
        // A8: "Doorgaan" verbruikt het herwerp voor dit doelgebied niet.
        var pendingCombat = new PendingCombat("alaska", "alberta", AttackDice: 2, AttackerRolls: [4, 2], AwaitingRerollDecision: true, CorrelationId);
        var state = BuildState(AttackTurnState(pendingCombat));

        var folded = Projection.Apply(state, new AttackDiceKept("game-1", "p1", "alberta"));

        Assert.Equal([4, 2], folded.TurnState!.PendingCombat!.AttackerRolls);
        Assert.False(folded.TurnState.PendingCombat.AwaitingRerollDecision);
        Assert.Empty(folded.TurnState.RerolledTargetTerritoryIds);
    }

    [Fact]
    public void AttackDieRerolled_NaEenAlGeslotenBeslissing_IsEenNoOp()
    {
        // C8: gelijktijdige RerollAttackDie + KeepAttackDice kunnen allebei tegen dezelfde
        // snapshot slagen — de tweede die vouwt mag de beslissing niet heropenen of de worp
        // nogmaals wijzigen.
        var pendingCombat = new PendingCombat("alaska", "alberta", AttackDice: 2, AttackerRolls: [4, 2], AwaitingRerollDecision: false, CorrelationId);
        var state = BuildState(AttackTurnState(pendingCombat, rerolledTargetTerritoryIds: []));

        var folded = Projection.Apply(
            state, new AttackDieRerolled("game-1", "p1", "alberta", PreviousRolls: [4, 2], RerolledDieIndex: 1, NewValue: 6, Rolls: [6, 4]));

        Assert.Equal([4, 2], folded.TurnState!.PendingCombat!.AttackerRolls);
        Assert.False(folded.TurnState.PendingCombat.AwaitingRerollDecision);
        Assert.Empty(folded.TurnState.RerolledTargetTerritoryIds);
    }

    [Fact]
    public void AttackDiceKept_NaEenAlGeslotenBeslissing_IsEenNoOp()
    {
        var pendingCombat = new PendingCombat("alaska", "alberta", AttackDice: 2, AttackerRolls: [4, 2], AwaitingRerollDecision: false, CorrelationId);
        var state = BuildState(AttackTurnState(pendingCombat));

        var folded = Projection.Apply(state, new AttackDiceKept("game-1", "p1", "alberta"));

        Assert.Same(state.TurnState!.PendingCombat, folded.TurnState!.PendingCombat);
    }

    [Fact]
    public void AttackDieRerolled_AnderDoelgebied_VoegtToeNaastEenAlBestaandHerwerptDoelgebied()
    {
        // A7: een ander doelgebied heeft zijn eigen, onafhankelijke herwerp — de lijst groeit,
        // hij wordt niet vervangen.
        var pendingCombat = new PendingCombat("alaska", "ontario", AttackDice: 1, AttackerRolls: [3], AwaitingRerollDecision: true, CorrelationId);
        var state = BuildState(AttackTurnState(pendingCombat, rerolledTargetTerritoryIds: ["alberta"]));

        var folded = Projection.Apply(
            state, new AttackDieRerolled("game-1", "p1", "ontario", PreviousRolls: [3], RerolledDieIndex: 0, NewValue: 5, Rolls: [5]));

        Assert.Equal(["alberta", "ontario"], folded.TurnState!.RerolledTargetTerritoryIds);
    }
}
