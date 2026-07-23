using RiskGame.Rules.State;

namespace RiskGame.Persistence.Events;

/// <summary>
/// Eerste event van elke spel-stream (TO §5.2). Genoeg om de statische
/// <see cref="Rules.Map.MapDefinition"/> te laden en de lobby-instellingen vast te leggen.
/// </summary>
public sealed record GameCreated(string GameId, string MapId, GameSettings Settings);
