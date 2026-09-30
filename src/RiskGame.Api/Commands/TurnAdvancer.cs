using Marten;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
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
/// in het geheugen), net als <see cref="EventRoundStep"/>.
/// </remarks>
public sealed class TurnAdvancer(GameProjection projection, EventRoundStep eventRound, TimeProvider timeProvider)
{
    /// <summary>
    /// Beëindigt de eigen beurt van <paramref name="playerId"/> en start de volgende.
    /// <paramref name="state"/> is de state van vóór het beurteinde; events die de aanroeper al voor
    /// deze beurt appendde (zoals <c>CardDrawn</c>) raken missies en versterkingen niet.
    /// </summary>
    public ValidationResult EndTurn(IDocumentSession session, GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        return EndTurn(session, state, playerId, isOwnTurn: true);
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

        var turnEnded = new TurnEnded(gameId, playerId);
        session.Events.Append(gameId, turnEnded);

        if (directWinners.Count > 0)
        {
            session.Events.Append(gameId, new GameWon(gameId, directWinners));
            return ValidationResult.Success();
        }

        if (ResolveLastChance(session, state, playerId, ownTurnPlayerId) is { } winners)
        {
            session.Events.Append(gameId, new GameWon(gameId, winners));
            return ValidationResult.Success();
        }

        var nextPlayerId = TurnOrderCalculator.NextActivePlayerId(state);

        if (nextPlayerId is null)
        {
            return ValidationResult.Failure("turnFlow.noNextPlayer");
        }

        // Voor de ínkomende speler rekenen, niet voor de uitgaande, en op de state zoals de
        // projectie hem straks ziet: na TurnEnded en na een eventuele gebeurtenisronde, zodat
        // een net getrokken bonus in ArmiesGranted meetelt (FO §9.2). CardDrawn en de
        // laatste-kans-events hierboven raken de versterkingen niet.
        var projected = projection.Apply(state, turnEnded);

        if (EventRoundCalculator.DrawsEventCard(state, nextPlayerId))
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
    /// Het laatste-kans-venster bij een beurteinde (FO §6.2, TO §5.2). Levert de winnaar(s) op als
    /// het spel daarmee gewonnen is, anders <c>null</c> (en zijn de venster-events al ge-appendt).
    /// </summary>
    private static IReadOnlyList<string>? ResolveLastChance(
        IDocumentSession session, GameState state, string playerId, string? ownTurnPlayerId)
    {
        var gameId = state.GameId;

        if (state.PendingWin is { } pendingWin)
        {
            var holds = WinConditionEvaluator.StillHoldsLastChanceMission(state, pendingWin.AchieverPlayerId);

            // Doorbroken tijdens een laatste-kans-beurt: het venster vervalt.
            if (pendingWin.RemainingPlayerIds.Contains(playerId) && !holds)
            {
                session.Events.Append(
                    gameId, new PendingWinBroken(gameId, pendingWin.AchieverPlayerId, pendingWin.MissionId, playerId));
                return null;
            }

            // Bij élk beurteinde opnieuw bepaald: wie tijdens het venster op auto-pass ging of werd
            // uitgeschakeld, telt vanaf dat moment als "al geweest" (FO §6.2, §11.2).
            var remaining = WinConditionEvaluator.RemainingLastChanceOpponents(state, pendingWin, playerId);

            if (remaining.Count == 0)
            {
                if (holds)
                {
                    return [pendingWin.AchieverPlayerId];
                }

                session.Events.Append(
                    gameId, new PendingWinBroken(gameId, pendingWin.AchieverPlayerId, pendingWin.MissionId, playerId));
                return null;
            }

            if (remaining.Count < pendingWin.RemainingPlayerIds.Count)
            {
                session.Events.Append(
                    gameId, new PendingWinNarrowed(gameId, pendingWin.AchieverPlayerId, playerId, remaining));
            }

            return null;
        }

        var lastChanceWinners = WinConditionEvaluator.LastChanceEligibleWinners(state, ownTurnPlayerId);

        if (lastChanceWinners.Count == 0)
        {
            return null;
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
            return [achieverId];
        }

        session.Events.Append(
            gameId, new PendingWinOpened(gameId, achieverId, state.Player(achieverId).Mission!.Id, opponents));

        return null;
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
