namespace RiskGame.Persistence.Events;

/// <summary>Een reeds gejoinde speler heeft een kleur gekozen (FO §2.2).</summary>
public sealed record ColorChosen(string GameId, string PlayerId, string ColorId);
