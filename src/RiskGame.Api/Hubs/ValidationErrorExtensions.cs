using PartyLink.Server.Errors;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Hubs;

/// <summary>
/// De enige omzetting van regel-engine-fouten naar het PartyLink-fouttype: één-op-één, code en
/// params ongewijzigd. Staat in de Api en niet in <c>RiskGame.Rules</c>, zodat de regel-engine
/// vrij blijft van transport-afhankelijkheden (CLAUDE.md).
/// </summary>
public static class ValidationErrorExtensions
{
    public static PartyLinkError ToPartyLinkError(this ValidationError error) => new(error.Code, error.Params);

    public static IReadOnlyList<PartyLinkError> ToPartyLinkErrors(this IReadOnlyList<ValidationError> errors) =>
        [.. errors.Select(ToPartyLinkError)];
}
