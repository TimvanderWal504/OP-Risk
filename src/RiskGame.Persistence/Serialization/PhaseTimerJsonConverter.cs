using System.Text.Json;
using System.Text.Json.Serialization;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Serialization;

/// <summary>
/// <see cref="PhaseTimer"/> heeft naast de primaire recordconstructor een tweede,
/// eenparameterige constructor (kortere notatie voor "vers, niet gepauzeerd") — System.Text.Json
/// kan bij twee publieke constructors niet zelf kiezen welke bij deserialisatie hoort, vandaar
/// deze expliciete converter, in dezelfde stijl als <see cref="MapDefinitionJsonConverter"/>.
/// </summary>
public sealed class PhaseTimerJsonConverter : JsonConverter<PhaseTimer>
{
    public override PhaseTimer Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var document = JsonDocument.ParseValue(ref reader);
        var root = document.RootElement;

        return new PhaseTimer(
            TimeSpan.Parse(root.GetProperty("remaining").GetString()!),
            root.GetProperty("isPaused").GetBoolean(),
            root.GetProperty("lastUpdatedUtc").GetDateTimeOffset());
    }

    public override void Write(Utf8JsonWriter writer, PhaseTimer value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("remaining", value.Remaining.ToString());
        writer.WriteBoolean("isPaused", value.IsPaused);
        writer.WriteString("lastUpdatedUtc", value.LastUpdatedUtc);
        writer.WriteEndObject();
    }
}
