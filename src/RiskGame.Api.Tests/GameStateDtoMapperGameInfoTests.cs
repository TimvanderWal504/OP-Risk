using RiskGame.Api.Dtos;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Api.Tests;

/// <summary>
/// Spelinfo op de telefoon (plan-testronde-tv punt 3): de mapper levert continent-bezit met bonus,
/// de gebeurteniscatalogus, de waarde van de volgende kaarteninleg en de startlegers per speler —
/// allemaal door de server bepaald, zodat de client geen spelregel of speeldata hoeft na te bouwen.
/// Pure mapper-tests: geen hub of database nodig.
/// </summary>
public sealed class GameStateDtoMapperGameInfoTests
{
    private static readonly MapDefinition Map =
        new MapDefinitionSource(Path.Combine(AppContext.BaseDirectory, "data", "maps")).Load("standaard-43");

    private static readonly GameSettings Settings = new(
        WinCondition.WorldDomination,
        SetupMode.Claiming,
        StartingArmiesPresetId: "classic",
        TurnTimer: TimeSpan.FromMinutes(3),
        FortifyTimer: TimeSpan.FromMinutes(1),
        RolesEnabled: false,
        RoleAssignment: RoleAssignmentMode.Random,
        EventsEnabled: false);

    private static GameState State(GamePhase phase, IReadOnlyCollection<string>? ownedByAlice = null, int nextTradeValue = 4)
    {
        var owned = ownedByAlice ?? [];
        var players = new[]
        {
            new Player("alice", "Alice", "red", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
            new Player("bob", "Bob", "blue", Hand: [], RoleId: null, Mission: null, IsEliminated: false),
        };

        return new GameState(
            "game-info",
            Map,
            phase,
            Settings,
            players,
            territories: Map.Territories
                .Select(territory => new TerritoryOwnership(
                    territory.Id,
                    owned.Contains(territory.Id) ? "alice" : "bob",
                    ArmyCount: 1))
                .ToArray(),
            turnOrder: ["alice", "bob"],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: nextTradeValue),
            activeEffects: []);
    }

    private static string[] TerritoriesOf(string continentId) =>
        [.. Map.Territories.Where(territory => territory.Continent == continentId).Select(territory => territory.Id)];

    [Fact]
    public void Continents_VolledigBezitGeeftDeEigenaar_GedeeltelijkBezitGeeftNiemand()
    {
        var australia = Map.Continents.Single(continent => continent.Id == "australia");
        // Alice bezit Australië helemaal, en van Azië precies één gebied; de rest is van Bob.
        var owned = TerritoriesOf("australia").Append(TerritoriesOf("asia")[0]).ToArray();

        var dto = GameStateDtoMapper.ToDto(State(GamePhase.InProgress, owned), TimeProvider.System);

        var australiaDto = dto.Continents.Single(continent => continent.Id == "australia");
        Assert.Equal("alice", australiaDto.OwnerPlayerId);
        Assert.Equal(australia.Bonus, australiaDto.Bonus);
        Assert.Null(dto.Continents.Single(continent => continent.Id == "asia").OwnerPlayerId);
        Assert.Equal("bob", dto.Continents.Single(continent => continent.Id == "europe").OwnerPlayerId);
        Assert.Equal(Map.Continents.Count, dto.Continents.Count);
    }

    [Fact]
    public void Events_LeveertDeHeleCatalogusMetDuur()
    {
        var dto = GameStateDtoMapper.ToDto(State(GamePhase.InProgress), TimeProvider.System);

        Assert.Equal(Map.Events.Select(definition => definition.Id), dto.Events.Select(summary => summary.Id));
        foreach (var definition in Map.Events)
        {
            var expected = definition.Effect.Duration == EffectDuration.OneRound
                ? EventDurationDto.OneRound
                : EventDurationDto.Instant;
            Assert.Equal(expected, dto.Events.Single(summary => summary.Id == definition.Id).Duration);
        }
    }

    [Fact]
    public void NextCardTradeValue_IsDeWaardeVanDeVolgendeInleg()
    {
        var dto = GameStateDtoMapper.ToDto(State(GamePhase.InProgress, nextTradeValue: 8), TimeProvider.System);

        Assert.Equal(8, dto.NextCardTradeValue);
    }

    [Fact]
    public void StartingArmies_InDeLobby_IsNull()
    {
        var dto = GameStateDtoMapper.ToDto(State(GamePhase.Lobby), TimeProvider.System);

        Assert.Null(dto.StartingArmies);
    }

    [Fact]
    public void StartingArmies_SpelersaantalBuitenHetPreset_IsNullInPlaatsVanEenFout()
    {
        var onePlayer = State(GamePhase.InProgress);
        var state = new GameState(
            onePlayer.GameId, Map, GamePhase.InProgress, Settings, [onePlayer.Players[0]], onePlayer.Territories,
            turnOrder: ["alice"], turnState: null, deck: onePlayer.Deck, activeEffects: []);

        var dto = GameStateDtoMapper.ToDto(state, TimeProvider.System);

        Assert.Null(dto.StartingArmies);
    }

    [Fact]
    public void StartingArmies_NaDeLobby_VolgtHetPresetBijDitSpelersaantal()
    {
        var expected = Map.StartingArmiesPresets.Single(preset => preset.Id == "classic").ArmiesByPlayerCount[2];

        var dto = GameStateDtoMapper.ToDto(State(GamePhase.InProgress), TimeProvider.System);

        Assert.Equal(expected, dto.StartingArmies);
    }
}
