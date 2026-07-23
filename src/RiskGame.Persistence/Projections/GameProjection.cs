using Marten.Events.Aggregation;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Map;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Projections;

/// <summary>
/// Vouwt de event-stream van één spel tot de geprojecteerde <see cref="GameState"/>
/// (TO §5.2). Bevat zelf geen spellogica: elke <c>Apply</c> is een pure vouwregel over
/// een al gebeurd feit, geen beslissing (src/CLAUDE.md, "event sourcing-kaders").
/// </summary>
/// <remarks>
/// Dekt tot nu toe de lobby-fase, de order-roll, de startopstelling, de rol-/missie-
/// toewijzing, de beurtstart, de versterkingsfase en kaarteninleg (spel aanmaken, spelers
/// joinen, kleur kiezen, spelersvolgorde bepalen, gebieden claimen/bijplaatsen, rol en
/// missie toewijzen, fase-overgangen binnen een beurt, legers versterken, kaarten
/// inleveren) — een zesde plak; <c>AttackDeclared</c> en de rest van het gevechts-
/// arsenaal (TO §5.2) staan nog open voor een latere plak.
/// <see cref="OrderRolled"/> en <see cref="TurnEnded"/> horen daar bewust niet bij: het
/// zijn audit/weergave-feiten zonder eigen vouwregel, zie de doc-comments op die events.
/// </remarks>
/// <remarks>
/// <see cref="TerritoryClaimed"/> en <see cref="InitialArmyPlaced"/> vouwen bewust alleen
/// het bezit/legeraantal van het genoemde gebied — of de Claiming/InitialPlacement-fase
/// daarmee klaar is, is een beslissing die bij de command-orchestratie van bouwstap 3
/// hoort. Zodra die beslissing valt, komt hij binnen als het hier al gevouwen
/// <see cref="PhaseChanged"/>-event.
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

    /// <summary>
    /// Bepaalt de nieuwe <see cref="PhaseTimer"/> volgens FO §5.4: Versterken start altijd
    /// een verse beurttimer (nieuwe beurt of eerste beurt na setup), Aanvallen deelt diezelfde
    /// doorlopende timer met Versterken (geen aparte timer per fase), en Verplaatsen krijgt
    /// een eigen, verse <see cref="GameSettings.FortifyTimer"/>.
    /// </summary>
    public GameState Apply(GameState state, PhaseChanged @event)
    {
        var timer = @event.TurnPhase switch
        {
            TurnPhase.Reinforce => new PhaseTimer(state.Settings.TurnTimer),
            TurnPhase.Attack => state.TurnState?.Timer ?? new PhaseTimer(state.Settings.TurnTimer),
            TurnPhase.Fortify => new PhaseTimer(state.Settings.FortifyTimer),
            _ => throw new ArgumentOutOfRangeException(
                nameof(@event), @event.TurnPhase, "Onbekende beurtfase."),
        };

        return state
            .WithPhase(GamePhase.InProgress)
            .WithTurnState(new TurnState(@event.PlayerId, @event.TurnPhase, timer, PendingCombat: null));
    }

    /// <summary>
    /// Zelfde vouwregel als <see cref="Apply(GameState, InitialArmyPlaced)"/>, maar dan met
    /// het aantal dat het <c>PlaceArmies</c>-commando (TO §4.1) in één keer toestaat.
    /// </summary>
    public GameState Apply(GameState state, ArmiesReinforced @event)
    {
        var territory = state.Territory(@event.TerritoryId);

        return state.WithTerritory(territory with { ArmyCount = territory.ArmyCount + @event.Amount });
    }

    /// <summary>
    /// De ingeleverde set verlaat de hand van de speler en gaat naar de aflegstapel; de
    /// eerstvolgende inlegwaarde escaleert (<see cref="CardTradeCalculator.NextTradeValueAfter"/>,
    /// FO §4.4). Eventuele bezitsbonussen (<see cref="CardTradeCalculator.Evaluate"/>) worden
    /// meteen op de genoemde gebieden geplaatst — die zijn niet vrij verdeelbaar, in
    /// tegenstelling tot de setwaarde zelf, die pas via een los <see cref="ArmiesReinforced"/>
    /// verschijnt zodra de speler kiest waar hij die plaatst.
    /// </summary>
    public GameState Apply(GameState state, CardsTraded @event)
    {
        var player = state.Player(@event.PlayerId);
        var tradedCards = @event.CardIds
            .Select(cardId => player.Hand.First(card => card.Id == cardId))
            .ToArray();

        var outcome = CardTradeCalculator.Evaluate(state, @event.PlayerId, tradedCards);

        state = state.WithPlayer(player with
        {
            Hand = [.. player.Hand.Where(card => !tradedCards.Contains(card))],
        });

        state = state.WithDeck(state.Deck with
        {
            DiscardPile = [.. state.Deck.DiscardPile, .. tradedCards],
            NextTradeValue = CardTradeCalculator.NextTradeValueAfter(state.Deck.NextTradeValue),
        });

        foreach (var bonus in outcome.OwnedTerritoryBonuses)
        {
            var territory = state.Territory(bonus.TerritoryId);
            state = state.WithTerritory(territory with { ArmyCount = territory.ArmyCount + bonus.Amount });
        }

        return state;
    }
}
