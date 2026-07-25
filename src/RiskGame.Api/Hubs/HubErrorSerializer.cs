using System.Text.Json;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Hubs;

/// <summary>
/// <see cref="Microsoft.AspNetCore.SignalR.HubException"/> kan alleen een string-message
/// dragen, geen structured data. Deze helper codeert <see cref="ValidationError"/>-lijsten
/// als JSON in die message, zodat de frontend de taalneutrale code(s) + params terug kan
/// lezen (i18n Fase 3-punt-3) i.p.v. rauwe .NET-tekst te tonen.
/// </summary>
public static class HubErrorSerializer
{
    // camelCase, zelfde policy als de ASP.NET-webdefaults die GameEndpoints.cs impliciet
    // gebruikt voor de REST 400-respons — anders zou de frontend twee casings moeten
    // begrijpen ("Code" via de hub, "code" via /games) voor exact hetzelfde contract.
    private static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web);

    public static string Serialize(IReadOnlyList<ValidationError> errors) => JsonSerializer.Serialize(errors, Options);

    public static string Serialize(ValidationError error) => Serialize([error]);
}
