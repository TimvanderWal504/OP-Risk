namespace RiskGame.Persistence.Events;

/// <summary>
/// De gebeurtenisstapel is (opnieuw) geschud, vlak vóór een trekking uit een lege stapel
/// (FO §9.2: zonder teruglegging). Draagt de volledige nieuwe volgorde, bovenste eerst — de
/// worp zelf is al gedaan door <see cref="Rules.Effects.EventDeckCalculator"/>.
/// </summary>
public sealed record EventDeckShuffled(string GameId, IReadOnlyList<string> EventIds);
