using System.Text.Json;
using System.Text.Json.Serialization;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map;

namespace RiskGame.Persistence.Serialization;

/// <summary>
/// <see cref="IEffect"/>-implementaties die in <see cref="ActiveEffect.Effect"/> terechtkomen
/// zijn altijd afkomstig uit <see cref="MapDefinition.Events"/> (gebeurtenis-effecten,
/// FO §9.2) — roleffecten (<see cref="RiskGame.Rules.Roles.RoleEffect"/>) implementeren
/// <see cref="IEffect"/> niet en worden nooit hier opgeslagen, ze worden live opgelost via
/// <see cref="RiskGame.Rules.State.Player.RoleId"/>. Net als <see cref="MissionJsonConverter"/>
/// volstaat het bewaren van de effect-id; resolutie gebeurt tegen de kaart die
/// <see cref="GameStateJsonConverter"/> voor dit document al heeft opgelost.
/// </summary>
public sealed class EffectJsonConverter(MapDefinition map) : JsonConverter<IEffect>
{
    public override IEffect? Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        var effectId = reader.GetString();

        ArgumentException.ThrowIfNullOrWhiteSpace(effectId);

        return map.Events.Select(@event => @event.Effect).First(effect => effect.Id == effectId);
    }

    public override void Write(Utf8JsonWriter writer, IEffect? value, JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(value.Id);
    }
}
