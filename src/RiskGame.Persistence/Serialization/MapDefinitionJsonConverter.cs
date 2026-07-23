using System.Text.Json;
using System.Text.Json.Serialization;
using RiskGame.Persistence.Map;
using RiskGame.Rules.Map;

namespace RiskGame.Persistence.Serialization;

/// <summary>
/// <see cref="MapDefinition"/> is statische, gevalideerde kaartdata die uitsluitend via
/// <see cref="MapDefinitionParser.Parse"/> gebouwd wordt (interne constructor, afgeleide
/// <see cref="MapDefinition.Adjacency"/>) — niet ontworpen om als JSON-document rondgestuurd
/// te worden. In een opgeslagen <see cref="Rules.State.GameState"/> volstaat het om alleen
/// <see cref="MapDefinition.MapId"/> te bewaren en de rest bij het lezen opnieuw te laden via
/// dezelfde <see cref="IMapDefinitionSource"/> als de projectie zelf gebruikt — de kaartdata
/// verandert toch niet per event, alleen het bezit van de gebieden.
/// </summary>
public sealed class MapDefinitionJsonConverter(IMapDefinitionSource mapSource) : JsonConverter<MapDefinition>
{
    public override MapDefinition Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var mapId = document.RootElement.GetProperty("mapId").GetString();

        ArgumentException.ThrowIfNullOrWhiteSpace(mapId);

        return mapSource.Load(mapId);
    }

    public override void Write(Utf8JsonWriter writer, MapDefinition value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("mapId", value.MapId);
        writer.WriteEndObject();
    }
}
