using System.Text.Json;
using System.Text.Json.Serialization;
using RiskGame.Rules.Map;
using RiskGame.Rules.Missions;

namespace RiskGame.Persistence.Serialization;

/// <summary>
/// <see cref="IMission"/>-implementaties zijn, in het spel zoals het geserialiseerd wordt,
/// altijd afkomstig uit <see cref="MapDefinition.Missions"/> (het extensiepunt dat
/// willekeurige eigen <see cref="IMission"/>-types toestaat, zie
/// <c>RiskGame.Rules.Tests.ExtensiepuntTests</c>, wordt nooit via Marten opgeslagen). Het
/// volstaat dus om alleen de missie-id te bewaren en die bij het lezen terug op te zoeken in
/// de kaart die <see cref="GameStateJsonConverter"/> voor dit document al heeft opgelost —
/// dezelfde aanpak als <see cref="RiskGame.Rules.State.Player.RoleId"/> plus
/// <see cref="RiskGame.Rules.Roles.RoleEffects.Active{TEffect}"/> in de rules engine.
/// </summary>
public sealed class MissionJsonConverter(MapDefinition map) : JsonConverter<IMission>
{
    public override IMission? Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        var missionId = reader.GetString();

        ArgumentException.ThrowIfNullOrWhiteSpace(missionId);

        return map.Missions.First(mission => mission.Id == missionId);
    }

    public override void Write(Utf8JsonWriter writer, IMission? value, JsonSerializerOptions options)
    {
        if (value is null)
        {
            writer.WriteNullValue();
            return;
        }

        writer.WriteStringValue(value.Id);
    }
}
