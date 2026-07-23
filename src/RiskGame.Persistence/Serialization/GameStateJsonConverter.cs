using System.Text.Json;
using System.Text.Json.Serialization;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Serialization;

/// <summary>
/// <see cref="GameState"/> draagt via <see cref="Player.Mission"/> en
/// <see cref="ActiveEffect.Effect"/> polymorfe interface-types
/// (<see cref="RiskGame.Rules.Missions.IMission"/>, <see cref="IEffect"/>) die System.Text.Json niet
/// zelfstandig kan (de)serialiseren — beide zijn alleen op te lossen aan de hand van de kaart
/// waar ze bij horen, net als <see cref="MapDefinitionJsonConverter"/> dat al voor
/// <see cref="MapDefinition"/> zelf doet. Deze converter lost daarom eerst <c>map</c> op (via
/// de al geregistreerde <see cref="MapDefinitionJsonConverter"/>) en geeft die kaart daarna
/// door aan <see cref="MissionJsonConverter"/>/<see cref="EffectJsonConverter"/> voor de rest
/// van het document — zonder daarvoor op JSON-eigenschapsvolgorde te hoeven vertrouwen.
/// </summary>
public sealed class GameStateJsonConverter : JsonConverter<GameState>
{
    public override GameState Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var root = document.RootElement;

        var map = root.GetProperty("map").Deserialize<MapDefinition>(options)!;
        var scoped = WithMissionAndEffectConverters(options, map);

        return new GameState(
            root.GetProperty("gameId").GetString()!,
            map,
            root.GetProperty("phase").Deserialize<GamePhase>(scoped),
            root.GetProperty("settings").Deserialize<GameSettings>(scoped)!,
            root.GetProperty("players").Deserialize<IReadOnlyList<Player>>(scoped)!,
            root.GetProperty("territories").Deserialize<IReadOnlyList<TerritoryOwnership>>(scoped)!,
            root.GetProperty("turnOrder").Deserialize<IReadOnlyList<string>>(scoped)!,
            root.GetProperty("turnState").Deserialize<TurnState?>(scoped),
            root.GetProperty("deck").Deserialize<DeckState>(scoped)!,
            root.GetProperty("activeEffects").Deserialize<IReadOnlyList<ActiveEffect>>(scoped)!);
    }

    public override void Write(Utf8JsonWriter writer, GameState value, JsonSerializerOptions options)
    {
        var scoped = WithMissionAndEffectConverters(options, value.Map);

        writer.WriteStartObject();

        writer.WriteString("gameId", value.GameId);
        writer.WritePropertyName("map");
        JsonSerializer.Serialize(writer, value.Map, scoped);
        writer.WritePropertyName("phase");
        JsonSerializer.Serialize(writer, value.Phase, scoped);
        writer.WritePropertyName("settings");
        JsonSerializer.Serialize(writer, value.Settings, scoped);
        writer.WritePropertyName("players");
        JsonSerializer.Serialize(writer, value.Players, scoped);
        writer.WritePropertyName("territories");
        JsonSerializer.Serialize(writer, value.Territories, scoped);
        writer.WritePropertyName("turnOrder");
        JsonSerializer.Serialize(writer, value.TurnOrder, scoped);
        writer.WritePropertyName("turnState");
        JsonSerializer.Serialize(writer, value.TurnState, scoped);
        writer.WritePropertyName("deck");
        JsonSerializer.Serialize(writer, value.Deck, scoped);
        writer.WritePropertyName("activeEffects");
        JsonSerializer.Serialize(writer, value.ActiveEffects, scoped);

        writer.WriteEndObject();
    }

    private static JsonSerializerOptions WithMissionAndEffectConverters(
        JsonSerializerOptions options, MapDefinition map)
    {
        var scoped = new JsonSerializerOptions(options);
        scoped.Converters.Add(new MissionJsonConverter(map));
        scoped.Converters.Add(new EffectJsonConverter(map));

        return scoped;
    }
}
