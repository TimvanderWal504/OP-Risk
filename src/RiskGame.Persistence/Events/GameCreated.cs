using RiskGame.Rules.State;

namespace RiskGame.Persistence.Events;

/// <summary>
/// Eerste event van elke spel-stream (TO §5.2). Genoeg om de statische
/// <see cref="Rules.Map.MapDefinition"/> te laden en de lobby-instellingen vast te leggen.
/// </summary>
/// <param name="TvDisplay">
/// Optioneel: de TV-weergave die de host-telefoon van een vorig spel onthield (plan-testronde-tv
/// punt 2). <c>null</c> — ook voor streams van vóór dit veld — betekent
/// <see cref="TvDisplaySettings.Default"/>.
/// </param>
public sealed record GameCreated(
    string GameId, string MapId, GameSettings Settings, TvDisplaySettings? TvDisplay = null);
