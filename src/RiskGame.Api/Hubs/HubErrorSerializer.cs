using PartyLink.Server.Errors;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Hubs;

/// <summary>
/// <see cref="Microsoft.AspNetCore.SignalR.HubException"/> kan alleen een string-message
/// dragen, geen structured data. Deze helper codeert <see cref="ValidationError"/>-lijsten
/// als JSON in die message, zodat de frontend de taalneutrale code(s) + params terug kan
/// lezen (i18n Fase 3-punt-3) i.p.v. rauwe .NET-tekst te tonen. Het formaat zelf is dat van
/// PartyLink (<see cref="PartyLinkErrorSerializer"/>); de regel-engine kent PartyLink niet, dus
/// de omzetting gebeurt hier, aan de hub-grens.
/// </summary>
public static class HubErrorSerializer
{
    public static string Serialize(IReadOnlyList<ValidationError> errors) =>
        PartyLinkErrorSerializer.Serialize(errors.ToPartyLinkErrors());

    public static string Serialize(ValidationError error) => Serialize([error]);
}
