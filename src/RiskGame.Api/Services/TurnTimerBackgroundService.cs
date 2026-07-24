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
/// feiten"). In plaats daarvan onthoudt deze service alleen in het geheugen wanneer een
/// (fase, actieve speler, <see cref="PhaseTimer"/>)-combinatie voor het eerst is
/// waargenomen; zolang die combinatie ongewijzigd blijft (geen <c>Fortified</c>,
/// <c>AttackDeclared</c>/<c>CombatResolved</c> of <c>PhaseChanged</c> ertussen), telt de
/// sindsdien verstreken kloktijd op bij <see cref="PhaseTimer.Tick"/>. Verandert de
/// combinatie (een speler heeft zelf gehandeld), dan wordt gewoon opnieuw gebaseerd — de
/// eventueel opgebouwde telling gaat verloren, wat hier geen probleem is: die telling was
/// toch al ingehaald door het echte spelersgedrag. Bij een serverherstart begint elke
/// timer met een verse baseline vanaf de laatst geprojecteerde <see cref="PhaseTimer.Remaining"/>
/// — precisie rond herstart-tijdens-pauze is een bewust open punt (TO §10.3), net als het
/// pollinterval hieronder.
/// </remarks>
public sealed class TurnTimerBackgroundService(
    IServiceScopeFactory scopeFactory, ILogger<TurnTimerBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(1);

    private readonly Dictionary<string, TimerWatch> _watches = [];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval);

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

    private async Task PollOnceAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var store = scope.ServiceProvider.GetRequiredService<IDocumentStore>();

        // Filteren op TurnPhase gebeurt hier in C#, niet via een Marten .Where()-predicate:
        // GameState heeft een volledig handgeschreven GameStateJsonConverter (RiskGame.
        // Persistence.Serialization), waardoor Martens LINQ->SQL-vertaling de JSONB-vorm van
        // "phase" niet betrouwbaar kan matchen. Het aantal gelijktijdig lopende spellen is
        // klein genoeg dat alles ophalen en client-side filteren geen probleem is.
        await using var querySession = store.QuerySession();
        var activeGames = (await querySession.Query<GameState>().ToListAsync(cancellationToken))
            .Where(state => state.Phase == GamePhase.InProgress)
            .ToList();

        var now = DateTimeOffset.UtcNow;
        var seenGameIds = new HashSet<string>();

        foreach (var state in activeGames)
        {
            seenGameIds.Add(state.GameId);

            if (state.TurnState?.Timer is not { } timer)
            {
                continue;
            }

            var turnState = state.TurnState;

            if (!_watches.TryGetValue(state.GameId, out var watch)
                || watch.Phase != turnState.TurnPhase
                || watch.ActivePlayerId != turnState.ActivePlayerId
                || watch.BaselineTimer != timer)
            {
                _watches[state.GameId] = new TimerWatch(turnState.TurnPhase, turnState.ActivePlayerId, timer, now);
                continue;
            }

            if (timer.IsPaused)
            {
                continue;
            }

            var effectiveTimer = timer.Tick(now - watch.ObservedAtUtc);

            if (!effectiveTimer.IsExpired)
            {
                continue;
            }

            _watches.Remove(state.GameId);

            await FireTimeoutAsync(scope.ServiceProvider, state.GameId, watch);
        }

        foreach (var staleGameId in _watches.Keys.Where(gameId => !seenGameIds.Contains(gameId)).ToList())
        {
            _watches.Remove(staleGameId);
        }
    }

    private async Task FireTimeoutAsync(IServiceProvider services, string gameId, TimerWatch watch)
    {
        var turnFlowCommands = services.GetRequiredService<TurnFlowCommandHandler>();

        var result = watch.Phase == TurnPhase.Fortify
            ? await turnFlowCommands.EndTurnAsync(gameId, watch.ActivePlayerId)
            : await turnFlowCommands.ForceAdvanceToFortifyAsync(gameId, watch.ActivePlayerId);

        if (!result.IsSuccess)
        {
            logger.LogInformation(
                "Timeout-overstap voor spel {GameId}, speler {PlayerId}, fase {Phase} afgewezen: {Errors}",
                gameId, watch.ActivePlayerId, watch.Phase, string.Join(" | ", result.Errors));
        }
    }

    private sealed record TimerWatch(
        TurnPhase Phase, string ActivePlayerId, PhaseTimer BaselineTimer, DateTimeOffset ObservedAtUtc);
}
