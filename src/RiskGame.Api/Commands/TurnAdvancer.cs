using Marten;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.AutoPass;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Alles tussen het einde van een beurt en het begin van de volgende, op één plek (TO §5.2):
/// missiecontrole en laatste-kans-venster (FO §6.1/§6.2), de volgende speler, de gebeurtenisronde op
/// de rondegrens (FO §9.2) en de start van de volgende beurt — inclusief de automatische beurt van
/// een speler op auto-pass (FO §11.2). Elk pad dat een beurt beëindigt of na een tussentoestand een
/// beurt start, loopt hierdoorheen, zodat FO §6.2 niet per pad uiteenloopt.
/// </summary>
/// <remarks>
/// Appendt alleen; opslaan doet de aanroeper, in dezelfde sessie als zijn eigen events. Rekent elke
/// volgende stap op de state zoals de projectie hem op dat moment ziet (<see cref="GameProjection"/>
/// in het geheugen), net als <see cref="EventRoundStep"/>. De automatische keten is recursief
/// (<see cref="StartTurn"/> → <c>PlayAutomaticTurn</c> → <c>EndTurn</c> → <see cref="StartTurn"/>) en
/// eindigt bij de eerste speler zonder auto-pass, bij <c>GameWon</c>, of bij een attrition-keuze die
/// op een mens wacht — hooguit één ronde diep.
/// </remarks>
public sealed class TurnAdvancer(
    GameProjection projection, EventRoundStep eventRound, IRandomSource random, TimeProvider timeProvider)
{
    /// <summary>
    /// Beëindigt de eigen beurt van <paramref name="playerId"/> (met de kaart bij een verovering, FO
    /// §5.2) en start de volgende. <paramref name="state"/> is de state van vóór het beurteinde.
    /// </summary>
    public ValidationResult EndTurn(IDocumentSession session, GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return EndTurn(session, DrawCardIfConquered(session, state, playerId), playerId, isOwnTurn: true);
    }

    /// <summary>
    /// Beëindigt de beurt van een speler die midden in die beurt op auto-pass ging (FO §11.2), nadat
    /// een lopend gevecht is uitgespeeld: de kaart bij een verovering wel (die heeft hij verdiend), maar
    /// het is geen eigen beurteinde — zijn <c>requiresOwnTurn</c>-missie telt niet (FO §6.1).
    /// </summary>
    public ValidationResult EndInterruptedTurn(IDocumentSession session, GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return EndTurn(session, DrawCardIfConquered(session, state, playerId), playerId, isOwnTurn: false);
    }

    /// <summary>
    /// FO §5.2: een beurt met minstens één verovering trekt aan het einde 1 kaart. De trekstapel is
    /// al geschud (bij spelstart, of hier bij een lege trekstapel) — de bovenste kaart pakken voegt
    /// dus geen extra toeval toe; <see cref="IRandomSource"/> is alleen nodig om de aflegstapel te
    /// hertschudden (TO §4.2).
    /// </summary>
    private GameState DrawCardIfConquered(IDocumentSession session, GameState state, string playerId)
    {
        if (!state.TurnState!.HasConqueredThisTurn)
        {
            return state;
        }

        var gameId = state.GameId;

        if (state.Deck.DrawPile.Count == 0 && state.Deck.DiscardPile.Count > 0)
        {
            var reshuffled = random.PickRandomSubset(state.Deck.DiscardPile, state.Deck.DiscardPile.Count);
            state = ProjectedAppend.Emit(
                session, state, new DeckShuffled(gameId, [.. reshuffled.Select(card => card.Id)]), projection.Apply);
        }

        if (state.Deck.DrawPile.Count > 0)
        {
            return ProjectedAppend.Emit(
                session, state, new CardDrawn(gameId, playerId, state.Deck.DrawPile[0].Id), projection.Apply);
        }

        if (state.Players.Sum(player => player.Hand.Count) != state.Map.Deck.Count)
        {
            // Beide stapels leeg terwijl niet alle kaarten in een hand zitten kan alleen een
            // bug zijn (bv. een stream zonder DeckShuffled bij spelstart) — geen stille no-op.
            throw new InvalidOperationException(
                $"Trekstapel en aflegstapel zijn beide leeg voor spel '{gameId}', maar niet alle kaarten zijn in een hand.");
        }

        return state;
    }

    /// <summary>
    /// Laat de beurt van <paramref name="playerId"/> beginnen (FO §5.2, §5.4): een
    /// <see cref="PhaseChanged"/> naar Versterken met een verse beurttimer en de toegekende
    /// versterkingen. Het ene instappunt voor elk pad dat een beurt start — de eerste beurt na de
    /// startopstelling, de volgende na <c>EndTurn</c>, en die na de laatste attrition-keuze (FO §9.2)
    /// — zodat timer en versterkingsberekening nooit per pad uiteenlopen. De versterkingen worden
    /// berekend op <paramref name="state"/>: de state zoals de projectie hem ziet op het moment dat
    /// deze beurt begint, niet een oudere. Staat de speler op auto-pass, dan speelt de server zijn
    /// beurt meteen af en gaat door naar de volgende (FO §11.2).
    /// </summary>
    public ValidationResult StartTurn(IDocumentSession session, GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(TurnPhase.Reinforce, state.Settings, currentTimer: null, now);

        state = ProjectedAppend.Emit(
            session,
            state,
            new PhaseChanged(
                state.GameId,
                playerId,
                TurnPhase.Reinforce,
                timer.Remaining,
                now,
                ReinforcementCalculator.CalculateArmies(state, playerId)),
            projection.Apply);

        return state.Player(playerId).IsAutoPass
            ? PlayAutomaticTurn(session, state, playerId)
            : ValidationResult.Success();
    }

    /// <summary>
    /// <paramref name="isOwnTurn"/> is <c>false</c> voor de automatische beurt van een speler op
    /// auto-pass: dan tellen de missies van de anderen wel, zijn <c>requiresOwnTurn</c>-missie niet
    /// (FO §6.1, §11.2).
    /// </summary>
    private ValidationResult EndTurn(IDocumentSession session, GameState state, string playerId, bool isOwnTurn)
    {
        var gameId = state.GameId;

        // FO §6.1/§6.2: de server controleert de missievoorwaarden na elke beurt. TurnEnded
        // vouwt alleen een geïnde gebeurtenisbonus weg (zie GameProjection) — niets waar een
        // missie naar kijkt — dus `state` is voor die controle exact de state "na afloop van
        // deze beurt".
        //
        // "GameWon op het moment dat de laatste laatste-kans-beurt eindigt" is hier bewust
        // gelijkgesteld aan "bij het begin van de volgende beurt van de missiehouder" (FO §6.2):
        // de overwinning wordt hieronder vastgesteld vóór een eventuele gebeurtenisronde, en een
        // gewonnen spel trekt geen kaart meer. Een attrition-kaart die het bord tússen twee beurten
        // verandert, telt pas mee bij de eerstvolgende beurteinde-controle (FO §6.2, besluit
        // 2026-09-26: geen extra controle direct na de attrition).
        var ownTurnPlayerId = isOwnTurn ? playerId : null;
        var directWinners = WinConditionEvaluator.DirectWinners(state, ownTurnPlayerId);

        // Vanaf hier rekent elke stap op de state zoals de projectie hem ziet, inclusief de net
        // ge-appende venster-events: de automatische keten beoordeelt het laatste-kans-venster bij
        // het volgende beurteinde opnieuw, en mag dat niet op een verouderd venster doen.
        var projected = ProjectedAppend.Emit(session, state, new TurnEnded(gameId, playerId), projection.Apply);

        if (directWinners.Count > 0)
        {
            session.Events.Append(gameId, new GameWon(gameId, directWinners));
            return ValidationResult.Success();
        }

        (projected, var winners) = ResolveLastChance(session, projected, playerId, ownTurnPlayerId);

        if (winners is not null)
        {
            session.Events.Append(gameId, new GameWon(gameId, winners));
            return ValidationResult.Success();
        }

        var nextPlayerId = TurnOrderCalculator.NextActivePlayerId(projected);

        if (nextPlayerId is null)
        {
            return ValidationResult.Failure("turnFlow.noNextPlayer");
        }

        // De versterkingen van de inkomende speler worden berekend op de state na een eventuele
        // gebeurtenisronde, zodat een net getrokken bonus in ArmiesGranted meetelt (FO §9.2).
        if (EventRoundCalculator.DrawsEventCard(projected, nextPlayerId))
        {
            var outcome = eventRound.Resolve(session, projected, nextPlayerId);

            if (outcome.AwaitsAttrition)
            {
                // De beurt van nextPlayerId start pas na de laatste attrition-keuze
                // (AttritionCommandHandler); PendingAttrition onthoudt wie dat is.
                return ValidationResult.Success();
            }

            projected = outcome.State;
        }

        return StartTurn(session, projected, nextPlayerId);
    }

    /// <summary>
    /// Het laatste-kans-venster bij een beurteinde (FO §6.2, TO §5.2). Levert de state na de
    /// venster-events op, en de winnaar(s) als het spel daarmee gewonnen is (anders <c>null</c>).
    /// <paramref name="state"/> is de state direct na <c>TurnEnded</c>; die vouwregel raakt niets
    /// waar een missie naar kijkt.
    /// </summary>
    private (GameState State, IReadOnlyList<string>? Winners) ResolveLastChance(
        IDocumentSession session, GameState state, string playerId, string? ownTurnPlayerId)
    {
        var gameId = state.GameId;

        if (state.PendingWin is { } pendingWin)
        {
            var holds = WinConditionEvaluator.StillHoldsLastChanceMission(state, pendingWin.AchieverPlayerId);

            // Doorbroken tijdens een laatste-kans-beurt: het venster vervalt.
            if (pendingWin.RemainingPlayerIds.Contains(playerId) && !holds)
            {
                return (ProjectedAppend.Emit(
                    session, state, new PendingWinBroken(gameId, pendingWin.AchieverPlayerId, pendingWin.MissionId, playerId), projection.Apply), null);
            }

            // Bij élk beurteinde opnieuw bepaald: wie tijdens het venster op auto-pass ging of werd
            // uitgeschakeld, telt vanaf dat moment als "al geweest" (FO §6.2, §11.2).
            var remaining = WinConditionEvaluator.RemainingLastChanceOpponents(state, pendingWin, playerId);

            if (remaining.Count == 0)
            {
                if (holds)
                {
                    return (state, [pendingWin.AchieverPlayerId]);
                }

                // Niemand meer om een laatste kans te geven en de missie geldt niet meer: het venster
                // vervalt. Deze beurt was geen laatste-kans-beurt (die tak staat hierboven), dus er is
                // geen aanwijsbare dader.
                return (ProjectedAppend.Emit(
                    session,
                    state,
                    new PendingWinBroken(gameId, pendingWin.AchieverPlayerId, pendingWin.MissionId, BrokenByPlayerId: null),
                    projection.Apply), null);
            }

            return remaining.Count < pendingWin.RemainingPlayerIds.Count
                ? (ProjectedAppend.Emit(
                    session, state, new PendingWinNarrowed(gameId, pendingWin.AchieverPlayerId, playerId, remaining), projection.Apply), null)
                : (state, null);
        }

        var lastChanceWinners = WinConditionEvaluator.LastChanceEligibleWinners(state, ownTurnPlayerId);

        if (lastChanceWinners.Count == 0)
        {
            return (state, null);
        }

        // Vereenvoudiging (FO §6.2): vervullen meerdere spelers in dezelfde beurt tegelijk
        // zo'n missie, dan opent alleen de eerste in de beurtvolgorde een venster; de
        // overige(n) worden opnieuw beoordeeld zodra dit venster is afgerond.
        var achieverId = state.TurnOrder.First(lastChanceWinners.Contains);
        var opponents = WinConditionEvaluator.LastChanceOpponents(state, achieverId);

        // Staan alle andere meespelende spelers op auto-pass, dan is er niemand om een laatste
        // kans te geven en wint de missiehouder meteen (FO §6.2).
        if (opponents.Count == 0)
        {
            return (state, [achieverId]);
        }

        return (ProjectedAppend.Emit(
            session,
            state,
            new PendingWinOpened(gameId, achieverId, state.Player(achieverId).Mission!.Id, opponents),
            projection.Apply), null);
    }

    /// <summary>
    /// De automatische beurt (FO §11.2): verplichte inleg, de pool over de frontgebieden, geen aanval,
    /// geen verplaatsing en geen kaart — daarna het beurteinde, dat geen eigen beurt is.
    /// <paramref name="state"/> is de state direct na de <see cref="PhaseChanged"/> naar Versterken.
    /// </summary>
    private ValidationResult PlayAutomaticTurn(IDocumentSession session, GameState state, string playerId)
    {
        var gameId = state.GameId;

        // SetAutoPass laat altijd iemand zonder auto-pass over (AutoPassGuards); zonder zo'n speler
        // zou deze keten nooit eindigen.
        if (!state.Players.Any(player => !player.IsEliminated && !player.IsAutoPass))
        {
            throw new InvalidOperationException($"Spel '{gameId}' heeft geen speler zonder auto-pass meer.");
        }

        while (AutoPassPlanner.MandatoryTrade(state, playerId) is { } trade)
        {
            var cardIds = trade.Select(card => card.Id).ToArray();
            EnsureAllowed(ReinforceGuards.CanTradeInCards(state, playerId, cardIds), gameId, playerId);

            var outcome = CardTradeCalculator.Evaluate(state, playerId, trade);

            state = ProjectedAppend.Emit(
                session,
                state,
                new CardsTraded(
                    gameId,
                    playerId,
                    cardIds,
                    outcome.SetValue,
                    outcome.OwnedTerritoryBonuses,
                    CardTradeCalculator.NextTradeValueAfter(state.Deck.NextTradeValue)),
                projection.Apply);
        }

        foreach (var placement in AutoPassPlanner.Placements(state, playerId, state.TurnState!.ArmiesRemaining))
        {
            EnsureAllowed(
                ReinforceGuards.CanPlaceArmies(state, playerId, placement.TerritoryId, placement.Amount), gameId, playerId);

            state = ProjectedAppend.Emit(
                session,
                state,
                new ArmiesReinforced(gameId, playerId, placement.TerritoryId, placement.Amount),
                projection.Apply);
        }

        return EndTurn(session, state, playerId, isOwnTurn: false);
    }

    /// <summary>
    /// De guards zijn bij de automatische beurt een vangnet, geen filter (TO §3.3): wat de planner
    /// kiest, is altijd toegestaan — een weigering is een bug, geen spelsituatie.
    /// </summary>
    private static void EnsureAllowed(ValidationResult validation, string gameId, string playerId)
    {
        if (!validation.IsSuccess)
        {
            throw new InvalidOperationException(
                $"Automatische beurt van '{playerId}' in spel '{gameId}' geweigerd: "
                + string.Join(", ", validation.Errors.Select(error => error.Code)));
        }
    }
}
