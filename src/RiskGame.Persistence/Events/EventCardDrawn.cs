namespace RiskGame.Persistence.Events;

/// <summary>
/// Na een volledige ronde is een gebeurteniskaart getrokken (FO §9.2): de bovenste van de
/// stapel. Wordt de laatst getrokken kaart (<see cref="Rules.State.EventRoundState.CurrentEventId"/>).
/// Wat de kaart dóét, komt via een los <see cref="EffectApplied"/>-event.
/// </summary>
public sealed record EventCardDrawn(string GameId, string EventId);
