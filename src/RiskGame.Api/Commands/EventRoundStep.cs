using Marten;
using RiskGame.Persistence.Events;
using RiskGame.Persistence.Projections;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Effects;
using RiskGame.Rules.State;

namespace RiskGame.Api.Commands;

/// <summary>
/// Wat er na de rondegrens-events geldt: de state zoals de projectie hem dan ziet, en of er
/// eerst nog op attrition-keuzes gewacht wordt (dan start er nog geen beurt).
/// </summary>
public sealed record EventRoundOutcome(GameState State, bool AwaitsAttrition);

/// <summary>
/// Handelt de rondegrens van de gebeurtenisronde af (FO §9.2): lopende effecten verlopen, de
/// volgende kaart wordt getrokken (zo nodig na schudden) en toegepast. Bij een attrition-kaart
/// staan spelers zonder keuzevrijheid meteen hun maximum af; wie wél kiest, opent de
/// tussentoestand (<see cref="AttritionStarted"/>).
/// </summary>
/// <remarks>
/// Elk ge-appende event wordt ook meteen in het geheugen gevouwen met dezelfde
/// <see cref="GameProjection"/> als Marten gebruikt (stateloos, als singleton uit DI). Zo rekent de
/// aanroeper de versterkingen van de volgende speler op de state ná de trekking (inclusief een net
/// vastgelegde bonus), zonder de vouwlogica te dupliceren of tussentijds op te slaan.
/// </remarks>
public sealed class EventRoundStep(GameProjection projection, IRandomSource random)
{
    public EventRoundOutcome Resolve(IDocumentSession session, GameState state, string nextPlayerId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(nextPlayerId);

        var gameId = state.GameId;

        foreach (var expiring in state.ActiveEffects.ToArray())
        {
            state = Emit(session, state, new EffectExpired(gameId, expiring.Effect.Id), projection.Apply);
        }

        var draw = EventDeckCalculator.Draw(state.EventRound.DrawPile, state.Map.Events, random);

        if (draw.ShuffledOrder is { } shuffledOrder)
        {
            state = Emit(session, state, new EventDeckShuffled(gameId, shuffledOrder), projection.Apply);
        }

        state = Emit(session, state, new EventCardDrawn(gameId, draw.EventId), projection.Apply);

        var effect = state.Map.Events.Single(definition => definition.Id == draw.EventId).Effect;

        state = Emit(
            session,
            state,
            new EffectApplied(gameId, draw.EventId, EventBonusCalculator.BonusesAtDraw(state, effect)),
            projection.Apply);

        return effect is IArmyAttritionEffect attrition
            ? StartAttrition(session, state, draw.EventId, attrition.Amount, nextPlayerId)
            : new EventRoundOutcome(state, AwaitsAttrition: false);
    }

    /// <summary>
    /// Wie precies zoveel of meer kan afstaan dan gevraagd, kiest zelf (FO §9.2, ook bij precies
    /// genoeg); de rest staat automatisch zijn maximum af. Spelers in beurtvolgorde, zodat de
    /// wachtlijst een vaste volgorde heeft.
    /// </summary>
    private EventRoundOutcome StartAttrition(
        IDocumentSession session, GameState state, string eventId, int amount, string nextPlayerId)
    {
        var gameId = state.GameId;
        var choosers = new List<string>();
        var participantIds = state.TurnOrder.Where(playerId => !state.Player(playerId).IsEliminated).ToArray();

        foreach (var playerId in participantIds)
        {
            if (ArmyAttritionCalculator.HasChoice(state, playerId, amount))
            {
                choosers.Add(playerId);
                continue;
            }

            // Ook een lege verdeling: wie geen legers kan missen, staat zo toch in het verloop.
            var removals = ArmyAttritionCalculator.AutoMaxRemovals(state, playerId);
            state = Emit(session, state, new ArmiesRemoved(gameId, playerId, removals), projection.Apply);
        }

        if (choosers.Count == 0)
        {
            return new EventRoundOutcome(state, AwaitsAttrition: false);
        }

        state = Emit(
            session, state, new AttritionStarted(gameId, eventId, amount, choosers, nextPlayerId), projection.Apply);

        return new EventRoundOutcome(state, AwaitsAttrition: true);
    }

    private static GameState Emit<TEvent>(
        IDocumentSession session, GameState state, TEvent @event, Func<GameState, TEvent, GameState> fold)
        where TEvent : notnull
    {
        session.Events.Append(state.GameId, @event);

        return fold(state, @event);
    }
}
