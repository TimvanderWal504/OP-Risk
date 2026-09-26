using System.Reflection;
using Microsoft.AspNetCore.SignalR;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Hubs;

/// <summary>
/// Weigert een hub-aanroep met <c>null</c> voor een parameter die niet nullable is gedeclareerd,
/// als gewone validatiefout (<c>common.missingArgument</c>) in plaats van een serverfout. SignalR
/// zet een ontbrekende of <c>null</c>-waarde uit de JSON gewoon door naar een <c>string</c>- of
/// array-parameter; de nullable-annotaties van C# gelden alleen tijdens het compileren. Zonder
/// dit filter kwam zo'n <c>null</c> in de regel-engine terecht, bijvoorbeeld als gebieds-id in
/// <see cref="RiskGame.Rules.State.GameState.HasTerritory"/>, waar de dictionary-lookup een
/// <see cref="ArgumentNullException"/> gooide. Eén controle aan de rand van de server, voor
/// elke hub-methode, i.p.v. null-checks verspreid door de regels.
/// </summary>
public sealed class NullArgumentFilter : IHubFilter
{
    public ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext, Func<HubInvocationContext, ValueTask<object?>> next)
    {
        var parameters = invocationContext.HubMethod.GetParameters();
        var arguments = invocationContext.HubMethodArguments;

        for (var index = 0; index < parameters.Length && index < arguments.Count; index++)
        {
            if (arguments[index] is null && !IsNullable(parameters[index]))
            {
                throw new HubException(HubErrorSerializer.Serialize(new ValidationError(
                    "common.missingArgument",
                    new Dictionary<string, string> { ["argument"] = parameters[index].Name ?? string.Empty })));
            }
        }

        return next(invocationContext);
    }

    private static bool IsNullable(ParameterInfo parameter) =>
        new NullabilityInfoContext().Create(parameter).WriteState != NullabilityState.NotNull;
}
