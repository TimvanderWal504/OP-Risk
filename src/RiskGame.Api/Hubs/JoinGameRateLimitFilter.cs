using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Hubs;

/// <summary>
/// Begrenst <see cref="GameHub.JoinGame"/>- en <see cref="GameHub.RejoinAsPlayer"/>-aanroepen per IP
/// (TO §8: "rate limiting... tegen brute-forcen van de 6-teken gamecode"). Joinen loopt uitsluitend via
/// hub-methodes, geen HTTP-endpoint — vandaar een <see cref="IHubFilter"/> i.p.v. ASP.NET Core's HTTP-
/// rate-limiting-middleware, die hier niet aangrijpt. Elke andere hub-methode vereist al een geldige,
/// 122-bit-Guid <c>playerId</c> — niet raadbaar zoals de 6-teken gamecode, dus buiten dit specifieke gat.
/// <c>RejoinAsPlayer</c> vraagt alleen een spelcode en een (publieke) naam en is daarmee een tweede
/// ingang voor hetzelfde gat. Elke methode telt in een eigen venster, zodat een groep spelers die zich
/// na een verbindingsstoring tegelijk herstelt, echte joiners vanaf hetzelfde IP niet blokkeert.
/// </summary>
public sealed class JoinGameRateLimitFilter(TimeProvider timeProvider) : IHubFilter
{
    // 7 spelers (FO: max lobbygrootte) die vlak na elkaar joinen vanaf hetzelfde gedeelde IP
    // (thuisnetwerk/Tailscale-uitgang) + een paar typefouten past hier ruim onder; een script
    // dat de 32^6 = 1.073.741.824 mogelijke gamecodes (GameIdGenerator.Alphabet, 32 tekens)
    // moet doorzoeken heeft aan 30 per 5 minuten nog altijd praktisch geen schijn van kans
    // binnen een redelijke tijd — bewust ruim, geen krappe drempel die echte spelers kan raken.
    private const int MaxAttemptsPerWindow = 30;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(5);

    /// <summary>Welke hub-methodes worden begrensd, en de foutcode waarmee een overschrijding wordt geweigerd.</summary>
    private static readonly Dictionary<string, string> LimitedMethods = new(StringComparer.Ordinal)
    {
        [nameof(GameHub.JoinGame)] = "common.tooManyJoinAttempts",
        [nameof(GameHub.RejoinAsPlayer)] = "common.tooManyReclaimAttempts",
    };

    private sealed record WindowState(DateTimeOffset WindowStart, int Count);

    private readonly ConcurrentDictionary<string, WindowState> _windows = new();

    // Zonder opruiming zou dit een langlevend proces (Azure App Service) laten volgroeien met
    // één entry per ooit geziene IP, voor altijd — een trage maar reële geheugenlek. Hoogstens
    // één sweep per venster (niet bij elke aanroep) houdt de kost daarvan verwaarloosbaar.
    private long _lastSweepTicks;

    public async ValueTask<object?> InvokeMethodAsync(
        HubInvocationContext invocationContext, Func<HubInvocationContext, ValueTask<object?>> next)
    {
        var method = invocationContext.HubMethodName;

        if (!LimitedMethods.TryGetValue(method, out var errorCode))
        {
            return await next(invocationContext);
        }

        var ip = invocationContext.Context.GetHttpContext()?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = timeProvider.GetUtcNow();

        var window = _windows.AddOrUpdate(
            $"{method}|{ip}",
            _ => new WindowState(now, 1),
            (_, existing) => now - existing.WindowStart > Window
                ? new WindowState(now, 1)
                : existing with { Count = existing.Count + 1 });

        SweepExpiredEntries(now);

        if (window.Count > MaxAttemptsPerWindow)
        {
            throw new HubException(HubErrorSerializer.Serialize(new ValidationError(errorCode)));
        }

        return await next(invocationContext);
    }

    private void SweepExpiredEntries(DateTimeOffset now)
    {
        var lastSweepTicks = Interlocked.Read(ref _lastSweepTicks);

        if (now.UtcTicks - lastSweepTicks < Window.Ticks)
        {
            return;
        }

        // CompareExchange i.p.v. onvoorwaardelijk schrijven: als twee aanroepen tegelijk de
        // drempel halen, sweept alleen degene die 'm daadwerkelijk claimt — geen dubbele sweep.
        if (Interlocked.CompareExchange(ref _lastSweepTicks, now.UtcTicks, lastSweepTicks) != lastSweepTicks)
        {
            return;
        }

        foreach (var entry in _windows)
        {
            if (now - entry.Value.WindowStart > Window)
            {
                // TryRemove(KeyValuePair) i.p.v. TryRemove(key): verwijdert alleen de precieze
                // (nog steeds verlopen) waarde die net gelezen is, nooit een intussen ververste
                // WindowState voor diezelfde IP.
                _windows.TryRemove(entry);
            }
        }
    }
}
