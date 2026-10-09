using System.Text.Json;

namespace PartyLink.Server.Errors;

/// <summary>
/// A <see cref="Microsoft.AspNetCore.SignalR.HubException"/> can only carry a string message, not
/// structured data. This helper encodes a list of <see cref="PartyLinkError"/>s as JSON in that
/// message, so the client can read the codes and parameters back and translate them itself:
/// <c>[{"code":"…","params":{…}}]</c>, with <c>params</c> as <c>null</c> when there are none.
/// </summary>
public static class PartyLinkErrorSerializer
{
    // camelCase, the same policy as the ASP.NET web defaults for REST responses, so a client sees one
    // casing for the same error contract over the hub and over HTTP.
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(IReadOnlyList<PartyLinkError> errors) => JsonSerializer.Serialize(errors, Options);

    public static string Serialize(PartyLinkError error) => Serialize([error]);
}
