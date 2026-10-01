using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// De echte speeldata van de standaard-43-kaart — de vaste kaart onder de regeltests.
/// </summary>
internal static class Standaard43Data
{
    public const string MapId = "standaard-43";

    public static string Json(string fileName) => MapTestData.Json(MapId, fileName);

    public static MapDataSources Sources() => MapTestData.Sources(MapId);

    public static MapDefinition Load() => MapTestData.Load(MapId);

    /// <summary>Het effect van gebeurteniskaart <paramref name="eventId"/> uit de echte events.json.</summary>
    public static IEffect EventEffect(string eventId) =>
        Load().Events.Single(definition => definition.Id == eventId).Effect;
}
