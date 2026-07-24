using Marten;
using RiskGame.Api.Commands;
using RiskGame.Rules.State;

namespace RiskGame.Api.Services;

/// <summary>
/// De serverklok voor de beurttimer (FO §5.4): het enige stuk van de architectuur dat
/// daadwerkelijk aftelt. <see cref="PhaseTimer"/> in de rules-engine kent bewust geen
/// klok-abstractie ("geen absolute deadline", src/CLAUDE.md), dus dat aftellen hoort hier
/// in de API-laag (TO §5.3).
/// </summary>
/// <remarks>
/// Geen nieuwe events voor het aftellen zelf — dat zou de event-stream vullen met een
/// technisch feit zonder speelbetekenis (src/CLAUDE.md, "events zijn betekenisvolle
/// feiten"). In plaats daarvan is de deadline een pure afleiding uit de projectie
/// (<c>timer.LastUpdatedUtc + timer.Remaining</c>, zie <see cref="PhaseTimer"/>): elk event
/// dat de timer beïnvloedt (<c>PhaseChanged</c>, <c>AttackDeclared</c>,
/// <c>CombatResolved</c>, <c>ArmiesMovedAfterConquest</c>) draagt zelf de resterende tijd en
/// een tijdstempel mee. Deze service houdt daarom geen eigen voortgang meer bij: elke poll
/// vergelijkt de klok met een deadline die volledig uit de laatst geprojecteerde
/// <see cref="GameState"/> is af te leiden — een serverherstart verliest dus niets.
///
/// Bij meerdere replica's kan <see cref="TurnFlowCommandHandler"/> nog steeds dubbel vuren:
/// <c>session.Events.Append</c> gebeurt zonder verwachte streamversie, dus twee
/// gelijktijdige pollers die dezelfde verlopen timer zien, kunnen allebei een geldige
/// overgang appenden. Single-instance blijft daarom voorlopig een aanname (een latere
/// bouwstap: expected-version guard of lease) — niet langer omdat state verloren zou gaan
/// bij herstart, maar omdat concurrency-bescherming op de command handler zelf ontbreekt.
/// </remarks>
public sealed class TurnTimerBackgroundService(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<TurnTimerBackgroundService> logger) : BackgroundService
{
    // Precisie komt nu uit de klok (LastUpdatedUtc + Remaining), niet uit het pollritme —
    // een langer interval kost dus alleen detectielatentie, geen aftel-nauwkeurigheid, en
    // scheelt een factor 5 databaselast t.o.v. elke seconde pollen.
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);

    // Puur voor log-throttling, geen correctheids-state: een geweigerde overstap wordt door
    // de volgende poll gewoon opnieuw geprobeerd (dat hoort zo, TurnFlowCommandHandler is de
    // enige bron van waarheid of de overstap mag). Zonder throttling zou een structureel
    // geweigerde overstap de logs vollopen; een servicerestart reset deze dictionary, wat
    // hooguit één extra warning oplevert.
    private static readonly TimeSpan WarnThrottle = TimeSpan.FromMinutes(2);
    private readonly Dictionary<string, DateTimeOffset> _lastWarnedAtUtc = [];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval, timeProvider);

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await PollOnceAsync(stoppingToken);
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    logger.LogError(exception, "Onverwachte fout tijdens het aftellen van beurttimers.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Normale shutdown.
        }
    }

    private async Task PollOnceAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var store = scope.ServiceProvider.GetRequiredService<IDocumentStore>();

        // Filteren op Phase gebeurt server-side dankzij een duplicated column op GameState
        // (GameStoreFactory: .Duplicate(x => x.Phase)) — zie die aanroep voor waarom dit niet
        // rechtstreeks via de JSONB kan.
        await using var querySession = store.QuerySession();
        var activeGames = await querySession.Query<GameState>()
            .Where(state => state.Phase == GamePhase.InProgress)
            .ToListAsync(cancellationToken);

        var now = timeProvider.GetUtcNow();
        var seenGameIds = new HashSet<string>();

        foreach (var state in activeGames)
        {
            seenGameIds.Add(state.GameId);

            if (state.TurnState is not { Timer: { IsPaused: false } timer } turnState)
            {
                continue;
            }

            var deadline = timer.LastUpdatedUtc + timer.Remaining;

            if (now < deadline)
            {
                continue;
            }

            await FireTimeoutAsync(scope.ServiceProvider, state.GameId, turnState, now);
        }

        foreach (var staleGameId in _lastWarnedAtUtc.Keys.Where(gameId => !seenGameIds.Contains(gameId)).ToList())
        {
            _lastWarnedAtUtc.Remove(staleGameId);
        }
    }

    private async Task FireTimeoutAsync(
        IServiceProvider services, string gameId, TurnState turnState, DateTimeOffset now)
    {
        var turnFlowCommands = services.GetRequiredService<TurnFlowCommandHandler>();

        var result = turnState.TurnPhase == TurnPhase.Fortify
            ? await turnFlowCommands.EndTurnAsync(gameId, turnState.ActivePlayerId)
            : await turnFlowCommands.ForceAdvanceToFortifyAsync(gameId, turnState.ActivePlayerId);

        if (!result.IsSuccess)
        {
            LogRejectedThrottled(gameId, turnState, result.Errors, now);
        }
    }

    private void LogRejectedThrottled(
        string gameId, TurnState turnState, IReadOnlyList<string> errors, DateTimeOffset now)
    {
        if (_lastWarnedAtUtc.TryGetValue(gameId, out var lastWarnedAtUtc)
            && now - lastWarnedAtUtc < WarnThrottle)
        {
            return;
        }

        _lastWarnedAtUtc[gameId] = now;

        logger.LogWarning(
            "Timeout-overstap voor spel {GameId}, speler {PlayerId}, fase {Phase} afgewezen: {Errors}",
            gameId, turnState.ActivePlayerId, turnState.TurnPhase, string.Join(" | ", errors));
    }
}
