namespace RiskGame.Persistence.Events;

/// <summary>
/// Een speler is de lobby binnengekomen, nog zonder kleur (FO §2.2).
/// <paramref name="IsHost"/> ligt vast op het moment van joinen (de eerste
/// joiner van een spel) — een beslissing van het commando, niet van de
/// projectie (src/CLAUDE.md, event-sourcing-kaders).
/// </summary>
public sealed record PlayerJoined(string GameId, string PlayerId, string Name, bool IsHost);
