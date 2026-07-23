namespace RiskGame.Persistence.Events;

/// <summary>
/// Na een volledige ronde trekt de server een gebeurteniskaart (FO §9.2). Puur
/// audit/weergave-feit voor de TV, net als <see cref="DiceRolled"/>: het daadwerkelijke
/// effect van de kaart komt via een los <see cref="EffectApplied"/>-event, dus dit event
/// heeft bewust geen eigen vouwregel in <see cref="Projections.GameProjection"/>.
/// </summary>
public sealed record EventCardDrawn(string GameId, string EventId);
