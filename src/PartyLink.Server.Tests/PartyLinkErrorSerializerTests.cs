using PartyLink.Server.Errors;

namespace PartyLink.Server.Tests;

/// <summary>
/// Pins the wire format literally: clients parse <c>code</c> and <c>params</c> from the hub exception
/// message. Fixed strings on purpose, so a renamed property or a different casing fails here.
/// </summary>
public sealed class PartyLinkErrorSerializerTests
{
    [Fact]
    public void Serialize_WithParams_WritesCodeAndParamsInCamelCase()
    {
        var json = PartyLinkErrorSerializer.Serialize(
            new PartyLinkError("room.unknown", new Dictionary<string, string> { ["roomId"] = "ABC123" }));

        Assert.Equal("""[{"code":"room.unknown","params":{"roomId":"ABC123"}}]""", json);
    }

    [Fact]
    public void Serialize_WithoutParams_WritesParamsAsNull()
    {
        var json = PartyLinkErrorSerializer.Serialize(new PartyLinkError("pairing.unknownCode"));

        Assert.Equal("""[{"code":"pairing.unknownCode","params":null}]""", json);
    }

    [Fact]
    public void Serialize_SeveralErrors_KeepsTheirOrder()
    {
        var json = PartyLinkErrorSerializer.Serialize(
        [
            new PartyLinkError("first", new Dictionary<string, string> { ["key"] = "value" }),
            new PartyLinkError("second"),
        ]);

        Assert.Equal("""[{"code":"first","params":{"key":"value"}},{"code":"second","params":null}]""", json);
    }
}
