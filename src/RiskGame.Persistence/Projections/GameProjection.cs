using Marten.Events.Aggregation;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Map;
using RiskGame.Rules.Missions;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Projections;

/// <summary>
/// Vouwt de event-stream van één spel tot de geprojecteerde <see cref="GameState"/>
/// (TO §5.2). Bevat zelf geen spellogica: elke <c>Apply</c> is een pure vouwregel over
/// een al gebeurd feit, geen beslissing (src/CLAUDE.md, "event sourcing-kaders").
/// </summary>
/// <remarks>
/// Dekt tot nu toe de lobby-fase, de order-roll, de startopstelling en de rol-/missie-
/// toewijzing (spel aanmaken, spelers joinen, kleur kiezen, spelersvolgorde bepalen,
/// gebieden claimen/bijplaatsen, rol en missie toewijzen) — een vierde plak; latere
/// plakken breiden dit uit met de rest van het event-arsenaal uit TO §5.2.
/// <see cref="OrderRolled"/> hoort daar bewust niet bij: het is een audit/weergave-feit
/// zonder eigen vouwregel, zie de doc-comment op dat event.
/// </remarks>
/// <remarks>
/// <see cref="TerritoryClaimed"/> en <see cref="InitialArmyPlaced"/> vouwen bewust alleen
/// het bezit/legeraantal van het genoemde gebied — of de Claiming/InitialPlacement-fase
/// daarmee klaar is (en welke fase/beurt daarna volgt) is een beslissing, geen vouwregel,
/// en komt bij een latere plak binnen via een apart <c>PhaseChanged</c>-event (TO §5.2)
/// zodra de rules-engine-orchestratie die beslissing kan nemen.
/// </remarks>
public sealed partial class GameProjection(IMapDefinitionSource mapSource) : SingleStreamProjection<GameState, string>
{
    public GameState Create(GameCreated @event)
    {
        var map = mapSource.Load(@event.MapId);

        var territories = map.Territories
            .Select(territory => new TerritoryOwnership(territory.Id, OwnerPlayerId: null, ArmyCount: 0))
            .ToArray();

        return new GameState(
            @event.GameId,
            map,
            GamePhase.Lobby,
            @event.Settings,
            players: [],
            territories,
            turnOrder: [],
            turnState: null,
            deck: new DeckState(DrawPile: [], DiscardPile: [], NextTradeValue: 4),
            activeEffects: []);
    }

    /// <summary>
    /// Een gejoinde speler verschijnt met een lege kleur; die wordt pas een volwaardige
    /// deelnemer zodra <see cref="ColorChosen"/> volgt (FO §2.2) — zie ook
    /// <see cref="Apply(GameState, ColorChosen)"/>.
    /// </summary>
    public GameState Apply(GameState state, PlayerJoined @event) =>
        state.WithPlayer(new Player(
            @event.PlayerId,
            @event.Name,
            ColorId: null,
            Hand: [],
            RoleId: null,
            Mission: null,
            IsEliminated: false,
            IsAutoPass: false));

    public GameState Apply(GameState state, ColorChosen @event) =>
        state.WithPlayer(state.Player(@event.PlayerId) with { ColorId = @event.ColorId });

    /// <summary>
    /// Legt de spelersvolgorde vast en stapt naar de startopstelling-fase die bij
    /// <see cref="GameSettings.SetupMode"/> hoort (FO §5.1): <see cref="GamePhase.Claiming"/>
    /// bij het claimen-model, anders direct <see cref="GamePhase.InitialPlacement"/> omdat
    /// de gebieden dan al willekeurig verdeeld worden. Beide fases zijn zelf nog geen
    /// "beurt" in de zin van <see cref="TurnState"/> (dat kent alleen Reinforce/Attack/
    /// Fortify, TO §4.1) — wie aan zet is binnen deze fases hoort bij een latere plak.
    /// </summary>
    public GameState Apply(GameState state, TurnOrderDetermined @event)
    {
        var nextPhase = state.Settings.SetupMode == SetupMode.Claiming
            ? GamePhase.Claiming
            : GamePhase.InitialPlacement;

        return state.WithTurnOrder(@event.PlayerIds).WithPhase(nextPhase);
    }

    /// <summary>
    /// Het geclaimde gebied verschijnt bij de speler met 1 leger — claimen verbruikt meteen
    /// een startleger (zie doc-comment op <see cref="TerritoryClaimed"/>).
    /// </summary>
    public GameState Apply(GameState state, TerritoryClaimed @event) =>
        state.WithTerritory(new TerritoryOwnership(@event.TerritoryId, @event.PlayerId, ArmyCount: 1));

    public GameState Apply(GameState state, InitialArmyPlaced @event)
    {
        var territory = state.Territory(@event.TerritoryId);

        return state.WithTerritory(territory with { ArmyCount = territory.ArmyCount + 1 });
    }

    public GameState Apply(GameState state, RoleAssigned @event) =>
        state.WithPlayer(state.Player(@event.PlayerId) with { RoleId = @event.RoleId });

    /// <summary>
    /// De speler kent zelf alleen de missie-id (FO §6.1); de bijbehorende
    /// <see cref="MissionDefinition"/> staat al gevalideerd in <see cref="MapDefinition.Missions"/>
    /// zodra de kaart geladen is, dus hier alleen opzoeken, niet opnieuw valideren.
    /// </summary>
    public GameState Apply(GameState state, MissionAssigned @event)
    {
        var mission = state.Map.Missions.First(mission => mission.Id == @event.MissionId);

        return state.WithPlayer(state.Player(@event.PlayerId) with { Mission = mission });
    }
}
