namespace RiskGame.Api.Services;

/// <summary>
/// Telt af voor de host-uitval (FO §11.1): elke <see cref="PollInterval"/> een ronde van
/// <see cref="HostAbsenceMonitor"/>. Zelfde opzet als <see cref="TurnTimerBackgroundService"/>: een
/// verse scope per ronde, en een onverwachte fout breekt de lus niet af.
/// </summary>
public sealed class HostAbsenceBackgroundService(
    IServiceScopeFactory scopeFactory,
    TimeProvider timeProvider,
    ILogger<HostAbsenceBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(PollInterval, timeProvider);

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    await scope.ServiceProvider.GetRequiredService<HostAbsenceMonitor>().CheckOnceAsync(stoppingToken);
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    logger.LogError(exception, "Onverwachte fout tijdens het controleren op een weggevallen host.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            // Normale shutdown.
        }
    }
}
