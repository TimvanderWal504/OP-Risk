using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
using RiskGame.Rules.Missions;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

/// <summary>
/// Bouwt een minimale maar geldige <see cref="GameState"/> op de echte standaard-43-kaart,
/// zodat een test alleen hoeft te benoemen wat voor díe regel telt.
/// </summary>
internal static class TestGame
{
    /// <summary>
    /// Instellingen met de standaardwaarden uit FO §5.4 en §10. Tests die niets met
    /// timers of winconditie te maken hebben, gebruiken deze ongewijzigd.
    /// </summary>
    public static GameSettings Settings() => new(
        WinCondition.WorldDomination,
        SetupMode.Random,
        StartingArmies: 30,
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: false);

    public static Player Player(
        string id,
        string colorId,
        bool isEliminated = false,
        bool isAutoPass = false,
        IMission? mission = null,
        string? roleId = null,
        IReadOnlyList<Card>? hand = null,
        string? eliminatedByPlayerId = null,
        bool isHost = false) =>
        new(id, $"Speler {id}", colorId, hand ?? [], roleId, mission, isEliminated, isAutoPass, eliminatedByPlayerId, isHost);

    /// <summary>
    /// Een spel in volle gang. Alle gebieden zijn onverdeeld tenzij een test ze via
    /// <see cref="GameState.WithTerritory"/> toekent; de eerste speler is aan de beurt.
    /// </summary>
    public static GameState InProgress(
        IReadOnlyList<Player>? players = null,
        TurnPhase turnPhase = TurnPhase.Reinforce,
        PhaseTimer? timer = null,
        PendingCombat? pendingCombat = null,
        IReadOnlyList<ActiveEffect>? activeEffects = null,
        GameSettings? settings = null,
        int nextTradeValue = 4,
        IReadOnlyList<string>? winners = null)
    {
        var map = Standaard43Data.Load();

        players ??= [Player("p1", "red"), Player("p2", "blue")];

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        var turnOrder = players.Select(player => player.Id).ToArray();

        return new GameState(
            gameId: "test-game",
            map,
            GamePhase.InProgress,
            settings ?? Settings(),
            players,
            territories,
            turnOrder,
            new TurnState(turnOrder[0], turnPhase, timer, pendingCombat),
            new DeckState(map.Deck, DiscardPile: [], nextTradeValue),
            activeEffects ?? [],
            winners ?? []);
    }
}
