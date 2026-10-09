using RiskGame.Api.Hubs;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Tests;

/// <summary>
/// Legt het foutformaat op de draad letterlijk vast: de frontend (<c>parseHubError</c>) leest
/// <c>code</c> en <c>params</c> uit de <c>HubException</c>-tekst. Bewust een vaste string i.p.v. een
/// vergelijking met een andere serializer — zo valt ook een hernoemd veld of een andere casing op.
/// </summary>
public sealed class HubErrorSerializerTests
{
    [Fact]
    public void Serialize_MetParams_GeeftCodeEnParamsInCamelCase()
    {
        var json = HubErrorSerializer.Serialize(
            new ValidationError("common.unknownGame", new Dictionary<string, string> { ["gameId"] = "ABC123" }));

        Assert.Equal("""[{"code":"common.unknownGame","params":{"gameId":"ABC123"}}]""", json);
    }

    [Fact]
    public void Serialize_ZonderParams_GeeftParamsNull()
    {
        var json = HubErrorSerializer.Serialize(new ValidationError("tvPairing.unknownCode"));

        Assert.Equal("""[{"code":"tvPairing.unknownCode","params":null}]""", json);
    }

    [Fact]
    public void Serialize_MeerdereFouten_BehoudtDeVolgorde()
    {
        var json = HubErrorSerializer.Serialize(
        [
            new ValidationError("lobby.colorTaken", new Dictionary<string, string> { ["colorId"] = "red" }),
            new ValidationError("common.unknownPlayer"),
        ]);

        Assert.Equal(
            """[{"code":"lobby.colorTaken","params":{"colorId":"red"}},{"code":"common.unknownPlayer","params":null}]""",
            json);
    }
}
