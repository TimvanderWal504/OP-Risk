using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace PartyLink.Server.Hubs;

/// <summary>
/// Catches and logs exceptions from hub method invocations in one central place instead of per hub
/// method. A <see cref="HubException"/> is a normal outcome — "this move is not allowed", answered to
/// the calling client only — and is logged at Information level; an unexpected exception (a bug) at
/// Error level. In both cases the exception continues unchanged to SignalR, which decides what the
/// client sees: a <see cref="HubException"/> message gets through, other exceptions are replaced by a
/// generic message by default, so internal details never leak to the client.
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
                "Hub method '{HubMethod}' rejected for connection {ConnectionId}: {Message}",
                invocationContext.HubMethodName,
                invocationContext.Context.ConnectionId,
                exception.Message);

            throw;
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Unexpected error in hub method '{HubMethod}' for connection {ConnectionId}.",
                invocationContext.HubMethodName,
                invocationContext.Context.ConnectionId);

            throw;
        }
    }
}
