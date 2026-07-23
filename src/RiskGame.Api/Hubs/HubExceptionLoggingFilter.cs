using Microsoft.AspNetCore.SignalR;

namespace RiskGame.Api.Hubs;

/// <summary>
/// Vangt en logt uitzonderingen uit hub-methode-aanroepen gestructureerd, op één
/// centrale plek in plaats van verspreid per hub-methode. Een <see cref="HubException"/>
/// is een normale uitkomst — "deze zet mag niet" (TO §4-diagram: "faalt → foutmelding
/// terug naar alleen deze client, geen state-wijziging") — en wordt op Information-niveau
/// gelogd; een onverwachte uitzondering (een bug) op Error-niveau. In beide gevallen gaat
/// de uitzondering ongewijzigd verder naar SignalR, dat zelf bepaalt wat de client te zien
/// krijgt: een <see cref="HubException"/>-boodschap komt door, andere uitzonderingen
/// worden door SignalR standaard vervangen door een generieke melding, zodat er nooit
/// interne details naar de client lekken.
/// </summary>
public sealed class HubExceptionLoggingFilter(ILogger<HubExceptionLoggingFilter> logger) : IHubFilter
{
    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext, Func<HubInvocationContext, ValueTask<object?>> next)
    {
        try
        {
            return await next(invocationContext);
        }
        catch (HubException exception)
        {
            logger.LogInformation(
                exception,
                "Hub-commando '{HubMethod}' geweigerd voor verbinding {ConnectionId}: {Message}",
                invocationContext.HubMethodName,
                invocationContext.Context.ConnectionId,
                exception.Message);

            throw;
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Onverwachte fout in hub-commando '{HubMethod}' voor verbinding {ConnectionId}.",
                invocationContext.HubMethodName,
                invocationContext.Context.ConnectionId);

            throw;
        }
    }
}
