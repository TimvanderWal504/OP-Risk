using Marten.Events.Aggregation;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Combat;
using RiskGame.Rules.Effects;
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
/// toewijzing, de beurtstart, de versterkingsfase, kaarteninleg, het volledige
/// gevechtsarsenaal, kaarttrekken, uitschakeling, de gebeurtenisronde-effecten en het
/// spel-einde (spel aanmaken, spelers joinen, kleur kiezen, spelersvolgorde bepalen,
/// gebieden claimen/bijplaatsen, rol en missie toewijzen, fase-overgangen binnen een
/// beurt, legers versterken, kaarten inleveren, aanvallen, veroveren, verplaatsen, kaart
/// trekken, een speler uitschakelen, een gebeurteniseffect toepassen/laten verlopen, het
/// spel winnen) — een achtste plak.
/// <see cref="OrderRolled"/>, <see cref="TurnEnded"/>, <see cref="DiceRolled"/>,
/// <see cref="EventCardDrawn"/> en <see cref="MissionCompleted"/> horen daar bewust niet
/// bij: het zijn audit/weergave-feiten zonder eigen vouwregel, zie de doc-comments op die
/// events.
/// </remarks>
/// <remarks>
/// <see cref="TerritoryClaimed"/>, <see cref="TerritoryAssigned"/> en
/// <see cref="InitialArmyPlaced"/> vouwen bewust alleen het bezit/legeraantal van het
/// genoemde gebied — of de Claiming/InitialPlacement-fase daarmee klaar is, is een
/// beslissing die bij de command-orchestratie van bouwstap 3 hoort. Zodra die beslissing
/// valt, komt hij binnen als het hier al gevouwen <see cref="PhaseChanged"/>-event.
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
            deck: new DeckState(
                DrawPile: [], DiscardPile: [], NextTradeValue: CardTradeCalculator.InitialTradeValue),
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
            IsAutoPass: false,
            IsHost: @event.IsHost));

    /// <summary>Zet de fase om naar de order-roll (FO §2.1); wie mag starten is al door
    /// <c>StartGame</c>-validatie afgedwongen vóór dit event ontstaat.</summary>
    public GameState Apply(GameState state, GameStarted @event) =>
        state.WithPhase(GamePhase.OrderRoll);

    public GameState Apply(GameState state, ColorChosen @event) =>
        state.WithPlayer(state.Player(@event.PlayerId) with { ColorId = @event.ColorId });

    /// <summary>De host heeft een wachtende speler verwijderd (FO/TO: geen sectie —
    /// nieuwe lobby-mutatie); de vouwregel filtert alleen de genoemde speler weg.</summary>
    public GameState Apply(GameState state, PlayerRemoved @event) =>
        state.WithoutPlayer(@event.PlayerId);

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

    /// <summary>Zelfde vouwregel als <see cref="TerritoryClaimed"/>; <c>CorrelationId</c> is
    /// alleen betekenisvol voor narratie-consumenten, niet voor de projectie.</summary>
    public GameState Apply(GameState state, TerritoryAssigned @event) =>
        state.WithTerritory(new TerritoryOwnership(@event.TerritoryId, @event.PlayerId, ArmyCount: 1));

    /// <summary>Maakt plaats voor het bijplaatsen van resterende startlegers (FO §5.1).</summary>
    public GameState Apply(GameState state, ClaimingCompleted @event) =>
        state.WithPhase(GamePhase.InitialPlacement);

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
    /// Puur vouwwerk: zowel de timerduur (<see cref="RiskGame.Rules.TurnFlow.PhaseTimerFactory"/>,
    /// FO §5.4) als de toegekende versterkingen
    /// (<see cref="RiskGame.Rules.Reinforcement.ReinforcementCalculator"/>, FO §5.2) zijn al
    /// bepaald vóórdat dit event ontstond; deze vouwregel neemt ze alleen over.
    /// </summary>
    public GameState Apply(GameState state, PhaseChanged @event)
    {
        var timer = new PhaseTimer(@event.Remaining, IsPaused: false, @event.OccurredAtUtc);

        // Een Versterken-event zonder toegekende legers kan niet bestaan: de producent hoort
        // het te vullen. Gebeurt dat toch, dan is dat een bug (of een event van vóór dit veld)
        // en geen regeluitkomst — dus een exception, geen stille 0.
        var armiesRemaining = @event.TurnPhase == TurnPhase.Reinforce
            ? @event.ArmiesGranted ?? throw new InvalidOperationException(
                $"PhaseChanged naar Versterken zonder ArmiesGranted (speler '{@event.PlayerId}').")
            : 0;

        return state
            .WithPhase(GamePhase.InProgress)
            .WithTurnState(new TurnState(
                @event.PlayerId, @event.TurnPhase, timer, PendingCombat: null, ArmiesRemaining: armiesRemaining));
    }

    /// <summary>
    /// Zelfde vouwregel als <see cref="Apply(GameState, InitialArmyPlaced)"/>, maar dan met
    /// het aantal dat het <c>PlaceArmies</c>-commando (TO §4.1) in één keer toestaat. Trekt
    /// dat aantal ook af van <see cref="TurnState.ArmiesRemaining"/> — de vrije pool die bij
    /// het ingaan van Versterken is vastgesteld (zie <see cref="Apply(GameState, PhaseChanged)"/>).
    /// </summary>
    public GameState Apply(GameState state, ArmiesReinforced @event)
    {
        var territory = state.Territory(@event.TerritoryId);

        state = state.WithTerritory(territory with { ArmyCount = territory.ArmyCount + @event.Amount });

        return state.WithTurnState(state.TurnState! with
        {
            ArmiesRemaining = state.TurnState!.ArmiesRemaining - @event.Amount,
        });
    }

    /// <summary>
    /// De ingeleverde set verlaat de hand van de speler en gaat naar de aflegstapel; de
    /// eerstvolgende inlegwaarde komt uit het event (FO §4.4). Eventuele bezitsbonussen worden
    /// meteen op de genoemde gebieden geplaatst — die zijn niet vrij verdeelbaar, in
    /// tegenstelling tot de setwaarde zelf, die pas via een los <see cref="ArmiesReinforced"/>
    /// verschijnt zodra de speler kiest waar hij die plaatst. Beide bedragen zijn al door
    /// <see cref="CardTradeCalculator"/> bepaald vóór het event; hier wordt niets meer berekend.
    /// </summary>
    public GameState Apply(GameState state, CardsTraded @event)
    {
        var player = state.Player(@event.PlayerId);
        var tradedCards = @event.CardIds
            .Select(cardId => player.Hand.First(card => card.Id == cardId))
            .ToArray();

        state = state.WithPlayer(player with
        {
            Hand = [.. player.Hand.Where(card => !tradedCards.Contains(card))],
        });

        state = state.WithDeck(state.Deck with
        {
            DiscardPile = [.. state.Deck.DiscardPile, .. tradedCards],
            NextTradeValue = @event.NextTradeValue,
        });

        foreach (var bonus in @event.OwnedTerritoryBonuses)
        {
            var territory = state.Territory(bonus.TerritoryId);
            state = state.WithTerritory(territory with { ArmyCount = territory.ArmyCount + bonus.Amount });
        }

        return state.WithTurnState(state.TurnState! with
        {
            ArmiesRemaining = state.TurnState!.ArmiesRemaining + @event.SetValue,
        });
    }

    /// <summary>
    /// Het moment van "Gooi" drukken (FO §5.3 stap 2): zet <see cref="PendingCombat"/> en
    /// pauzeert de lopende beurttimer (FO §5.4) — uitgevoerde aanvallen kosten de aanvaller
    /// zo geen beurttijd. <see cref="TurnState.PausedAttackTarget"/> wordt hier onvoorwaardelijk
    /// op dit gebiedspaar gezet: bij een herhaalde aanval op hetzelfde doelwit is dat dezelfde
    /// waarde (geen verandering), bij een nieuw doelwit vervangt het de vorige — de
    /// command handler heeft <see cref="AttackDeclared.Remaining"/> in dat laatste geval al
    /// verrekend met de tussenliggende tijd (<see cref="PhaseTimer.ResumeAndTick"/>).
    /// </summary>
    public GameState Apply(GameState state, AttackDeclared @event) =>
        state.WithTurnState(state.TurnState! with
        {
            PendingCombat = new PendingCombat(
                @event.FromTerritoryId, @event.ToTerritoryId, @event.AttackDice, @event.CorrelationId),
            PausedAttackTarget = new AttackEngagement(@event.FromTerritoryId, @event.ToTerritoryId),
            Timer = state.TurnState!.Timer!.Pause(@event.Remaining, @event.OccurredAtUtc),
        });

    /// <summary>
    /// Trekt de verliezen af van beide legeraantallen en gebruikt
    /// <see cref="ConquestResolution.Apply"/> — puur deterministisch, geen herimplementatie
    /// — om af te leiden of het doelgebied hierdoor valt. <see cref="PendingCombat"/> gaat in
    /// beide gevallen naar <c>null</c> zodra het doelgebied niet valt (het gevecht zelf is
    /// dan afgehandeld), maar de beurttimer blijft doorlopend gepauzeerd (FO §5.4, herzien op
    /// 2026-08-04): "een gevecht" is de hele belegering van dit doelwit, niet één worp — de
    /// timer hervat pas als de aanvaller een ánder doelwit kiest (<see cref="AttackDeclared"/>
    /// met een ander gebiedspaar) of de fase verlaat, niet automatisch hier. Valt het
    /// doelgebied wel, dan blijft ook <see cref="PendingCombat"/> staan tot
    /// <see cref="ArmiesMovedAfterConquest"/> volgt.
    /// </summary>
    public GameState Apply(GameState state, CombatResolved @event)
    {
        var fromTerritory = state.Territory(@event.FromTerritoryId);
        var toTerritory = state.Territory(@event.ToTerritoryId);

        var outcome = new CombatOutcome(
            @event.AttackerRolls, @event.DefenderRolls, @event.AttackerLosses, @event.DefenderLosses);
        var conquest = ConquestResolution.Apply(fromTerritory.ArmyCount, toTerritory.ArmyCount, outcome);

        state = state
            .WithTerritory(fromTerritory with { ArmyCount = conquest.AttackerArmyCount })
            .WithTerritory(toTerritory with { ArmyCount = conquest.DefenderArmyCount });

        if (!conquest.Conquered)
        {
            state = state.WithTurnState(state.TurnState! with { PendingCombat = null });
        }

        return state;
    }

    /// <summary>
    /// Alleen het eigendom gaat over — het legeraantal staat door het voorafgaande
    /// <see cref="CombatResolved"/> al op 0 (zie doc-comment op dit event).
    /// </summary>
    public GameState Apply(GameState state, TerritoryConquered @event) =>
        state.WithTerritory(state.Territory(@event.TerritoryId) with { OwnerPlayerId = @event.PlayerId });

    /// <summary>
    /// Sluit het gevecht af (FO §5.4: inclusief eventuele meeverplaatsing na verovering) —
    /// <see cref="PendingCombat"/> naar <c>null</c>, timer hervat, <see cref="TurnState.PausedAttackTarget"/>
    /// naar <c>null</c> (de belegering van dit doelwit is voorbij) — bovenop dezelfde
    /// leger-verplaatsing als <see cref="Apply(GameState, Fortified)"/>.
    /// </summary>
    public GameState Apply(GameState state, ArmiesMovedAfterConquest @event)
    {
        state = MoveArmies(state, @event.FromTerritoryId, @event.ToTerritoryId, @event.Amount);

        return state.WithTurnState(state.TurnState! with
        {
            PendingCombat = null,
            PausedAttackTarget = null,
            Timer = state.TurnState!.Timer!.Resume(@event.OccurredAtUtc),
        });
    }

    /// <summary>
    /// Sluit de belegering van het huidige doelwit af zonder verovering (FO §5.4,
    /// "Ander gevecht") — hervat de beurttimer op het al door de command handler verrekende
    /// bedrag (zie <see cref="AttackAbandoned.Remaining"/>) en wist <see cref="TurnState.PausedAttackTarget"/>.
    /// <see cref="TurnState.PendingCombat"/> staat hier altijd al op <c>null</c>
    /// (<see cref="AttackGuards.CanAbandonAttack"/> vereist dat).
    /// </summary>
    public GameState Apply(GameState state, AttackAbandoned @event) =>
        state.WithTurnState(state.TurnState! with
        {
            PausedAttackTarget = null,
            Timer = state.TurnState!.Timer! with
            {
                Remaining = @event.Remaining,
                IsPaused = false,
                LastUpdatedUtc = @event.OccurredAtUtc,
            },
        });

    /// <summary>
    /// Eén vrije verplaatsing tijdens Verplaatsen (FO §5.2, moderne variant). Zet naast de
    /// legerverplaatsing ook <see cref="TurnState.HasFortified"/> — de Kernregel "één
    /// verplaatsing" wordt daarmee afgedwongen door <see cref="Fortify.FortifyGuards.CanFortify"/>,
    /// niet alleen geregistreerd.
    /// </summary>
    public GameState Apply(GameState state, Fortified @event)
    {
        state = MoveArmies(state, @event.FromTerritoryId, @event.ToTerritoryId, @event.Amount);

        return state.WithTurnState(state.TurnState! with { HasFortified = true });
    }

    /// <summary>Haalt de genoemde kaart uit de trekstapel naar de hand van de speler (FO §5.2).</summary>
    public GameState Apply(GameState state, CardDrawn @event)
    {
        var card = state.Deck.DrawPile.First(card => card.Id == @event.CardId);
        var player = state.Player(@event.PlayerId);

        return state
            .WithPlayer(player with { Hand = [.. player.Hand, card] })
            .WithDeck(state.Deck with { DrawPile = [.. state.Deck.DrawPile.Where(c => c != card)] });
    }

    /// <summary>
    /// De hand van de uitgeschakelde speler gaat naar wie hem uitschakelde (FO §7); de
    /// "≥ 6 kaarten → direct verplicht inleggen"-vervolgregel is command-orchestratie
    /// (een latere bouwstap), geen onderdeel van deze vouwregel. Onthoudt ook wíe de
    /// speler uitschakelde (<see cref="Player.EliminatedByPlayerId"/>), nodig om
    /// <see cref="EliminatePlayerMission"/> (FO §6.1) te kunnen toetsen.
    /// </summary>
    public GameState Apply(GameState state, PlayerEliminated @event)
    {
        var eliminated = state.Player(@event.EliminatedPlayerId);
        var eliminator = state.Player(@event.EliminatedByPlayerId);
        var transferredHand = eliminated.Hand;

        state = state.WithPlayer(eliminated with
        {
            Hand = [],
            IsEliminated = true,
            EliminatedByPlayerId = @event.EliminatedByPlayerId,
        });

        return state.WithPlayer(eliminator with { Hand = [.. eliminator.Hand, .. transferredHand] });
    }

    /// <summary>
    /// Past de al door de rules engine berekende leger-mutaties toe (zie doc-comment op
    /// <see cref="EffectApplied"/>) en voegt, bij een <see cref="EffectDuration.OneRound"/>-
    /// effect, een nieuwe <see cref="ActiveEffect"/> toe zodat de TV het permanent kan
    /// tonen zolang het geldt (FO §9.2). Instant-effecten komen niet in
    /// <see cref="GameState.ActiveEffects"/> terecht — ze zijn na deze vouwregel al voltrokken.
    /// </summary>
    public GameState Apply(GameState state, EffectApplied @event)
    {
        var eventDefinition = state.Map.Events.First(definition => definition.Id == @event.EventId);

        foreach (var (territoryId, delta) in @event.ArmyDeltasByTerritory)
        {
            var territory = state.Territory(territoryId);
            state = state.WithTerritory(territory with { ArmyCount = territory.ArmyCount + delta });
        }

        if (eventDefinition.Effect.Duration == EffectDuration.OneRound)
        {
            state = state.WithActiveEffects(
                [.. state.ActiveEffects, new ActiveEffect(eventDefinition.Effect, RoundsRemaining: 1)]);
        }

        return state;
    }

    /// <summary>Haalt het verlopen effect uit <see cref="GameState.ActiveEffects"/> (FO §9.2).</summary>
    public GameState Apply(GameState state, EffectExpired @event) =>
        state.WithActiveEffects(
            [.. state.ActiveEffects.Where(activeEffect => activeEffect.Effect.Id != @event.EventId)]);

    /// <summary>Legt de winnaar(s) vast en sluit het spel af (FO §7).</summary>
    public GameState Apply(GameState state, GameWon @event) =>
        state.WithPhase(GamePhase.Finished).WithWinners(@event.WinnerPlayerIds);

    /// <summary>
    /// Gedeelde leger-verplaatsing tussen twee gebieden (bron −<paramref name="amount"/>,
    /// doel +<paramref name="amount"/>) — hergebruikt door zowel
    /// <see cref="Apply(GameState, ArmiesMovedAfterConquest)"/> als
    /// <see cref="Apply(GameState, Fortified)"/> (DRY, src/CLAUDE.md).
    /// </summary>
    private static GameState MoveArmies(GameState state, string fromTerritoryId, string toTerritoryId, int amount)
    {
        var fromTerritory = state.Territory(fromTerritoryId);
        var toTerritory = state.Territory(toTerritoryId);

        return state
            .WithTerritory(fromTerritory with { ArmyCount = fromTerritory.ArmyCount - amount })
            .WithTerritory(toTerritory with { ArmyCount = toTerritory.ArmyCount + amount });
    }
}
