using Marten;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Reinforcement;
using RiskGame.Rules.State;
using RiskGame.Rules.TurnFlow;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

/// <summary>
/// Alles tussen het einde van een beurt en het begin van de volgende, op één plek (TO §5.2):
/// missiecontrole en laatste-kans-venster (FO §6.1/§6.2), de volgende speler, de gebeurtenisronde op
/// de rondegrens (FO §9.2) en de start van de volgende beurt. Elk pad dat een beurt beëindigt of na
/// een tussentoestand een beurt start, loopt hierdoorheen, zodat FO §6.2 niet per pad uiteenloopt.
/// </summary>
/// <remarks>
/// Appendt alleen; opslaan doet de aanroeper, in dezelfde sessie als zijn eigen events. Rekent elke
/// volgende stap op de state zoals de projectie hem op dat moment ziet (<see cref="GameProjection"/>
/// in het geheugen), net als <see cref="EventRoundStep"/>.
/// </remarks>
public sealed class TurnAdvancer(GameProjection projection, EventRoundStep eventRound, TimeProvider timeProvider)
{
    /// <summary>
    /// Beëindigt de beurt van <paramref name="playerId"/> en start zo nodig de volgende.
    /// <paramref name="state"/> is de state van vóór het beurteinde; events die de aanroeper al voor
    /// deze beurt appendde (zoals <c>CardDrawn</c>) raken missies en versterkingen niet.
    /// </summary>
    public ValidationResult EndTurn(IDocumentSession session, GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

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
        var directWinners = WinConditionEvaluator.DirectWinners(state, playerId);

        var turnEnded = new TurnEnded(gameId, playerId);
        session.Events.Append(gameId, turnEnded);

        if (directWinners.Count > 0)
        {
            session.Events.Append(gameId, new GameWon(gameId, directWinners));
            return ValidationResult.Success();
        }

        if (state.PendingWin is { } pendingWin)
        {
            if (pendingWin.RemainingPlayerIds.Contains(playerId))
            {
                if (!WinConditionEvaluator.StillHoldsLastChanceMission(state, pendingWin.AchieverPlayerId))
                {
                    session.Events.Append(
                        gameId,
                        new PendingWinBroken(gameId, pendingWin.AchieverPlayerId, pendingWin.MissionId, playerId));
                }
                else
                {
                    var remaining = WinConditionEvaluator.RemainingLastChanceOpponents(state, pendingWin, playerId);

                    if (remaining.Count == 0)
                    {
                        session.Events.Append(gameId, new GameWon(gameId, [pendingWin.AchieverPlayerId]));
                        return ValidationResult.Success();
                    }

                    session.Events.Append(
                        gameId,
                        new PendingWinNarrowed(gameId, pendingWin.AchieverPlayerId, playerId, remaining));
                }
            }

            // Anders: het venster loopt, maar deze beurt hoort er niet bij (bv. de missiehouder
            // zelf) — niets aan PendingWin te doen, gewoon door naar de volgende speler hieronder.
        }
        else
        {
            var lastChanceWinners = WinConditionEvaluator.LastChanceEligibleWinners(state, playerId);

            if (lastChanceWinners.Count > 0)
            {
                // Vereenvoudiging (FO §6.2): vervullen meerdere spelers in dezelfde beurt tegelijk
                // zo'n missie, dan opent alleen de eerste in de beurtvolgorde een venster; de
                // overige(n) worden opnieuw beoordeeld zodra dit venster is afgerond.
                var achieverId = state.TurnOrder.First(lastChanceWinners.Contains);
                var missionId = state.Player(achieverId).Mission!.Id;

                // Kan hier nooit leeg zijn: was achieverId de enige niet-uitgeschakelde speler,
                // dan had HasWorldDomination hierboven al direct gewonnen.
                var remainingOpponents = WinConditionEvaluator.LastChanceOpponents(state, achieverId);

                session.Events.Append(
                    gameId, new PendingWinOpened(gameId, achieverId, missionId, remainingOpponents));
            }
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

        StartTurn(session, projected, nextPlayerId);

        return ValidationResult.Success();
    }

    /// <summary>
    /// Laat de beurt van <paramref name="playerId"/> beginnen (FO §5.2, §5.4): een
    /// <see cref="PhaseChanged"/> naar Versterken met een verse beurttimer en de toegekende
    /// versterkingen. Het ene instappunt voor elk pad dat een beurt start — de eerste beurt na de
    /// startopstelling, de volgende na <c>EndTurn</c>, en die na de laatste attrition-keuze (FO §9.2)
    /// — zodat timer en versterkingsberekening nooit per pad uiteenlopen. De versterkingen worden
    /// berekend op <paramref name="state"/>: de state zoals de projectie hem ziet op het moment dat
    /// deze beurt begint, niet een oudere.
    /// </summary>
    public void StartTurn(IDocumentSession session, GameState state, string playerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        var now = timeProvider.GetUtcNow();
        var timer = PhaseTimerFactory.ForPhase(TurnPhase.Reinforce, state.Settings, currentTimer: null, now);

        session.Events.Append(
            state.GameId,
            new PhaseChanged(
                state.GameId,
                playerId,
                TurnPhase.Reinforce,
                timer.Remaining,
                now,
                ReinforcementCalculator.CalculateArmies(state, playerId)));
    }
}
