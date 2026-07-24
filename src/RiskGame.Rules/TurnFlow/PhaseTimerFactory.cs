using RiskGame.Rules.State;

namespace RiskGame.Rules.TurnFlow;

/// <summary>
/// Bepaalt de <see cref="PhaseTimer"/> die bij een fase-overgang hoort (FO §5.4): een
/// beslissing, en beslissingen horen vóór het event te vallen, niet in de projectie
/// (src/CLAUDE.md, "event sourcing-kaders"). Command handlers roepen dit aan om
/// <see cref="RiskGame.Persistence.Events.PhaseChanged.Remaining"/> te vullen vóórdat ze
/// het event appenden; <c>GameProjection</c> vouwt dat resultaat daarna alleen nog.
/// </summary>
public static class PhaseTimerFactory
{
    /// <summary>
    /// Versterken en Verplaatsen starten een verse timer uit <paramref name="settings"/>;
    /// Aanvallen deelt de doorlopende timer van Versterken, dus die telt hier door vanaf
    /// <paramref name="currentTimer"/> tot <paramref name="now"/> (geen verse duur).
    /// </summary>
    public static PhaseTimer ForPhase(
        TurnPhase nextPhase, GameSettings settings, PhaseTimer? currentTimer, DateTimeOffset now) =>
        nextPhase switch
        {
            TurnPhase.Reinforce => new PhaseTimer(settings.TurnTimer, now),
            TurnPhase.Attack => currentTimer is { } timer
                ? timer.Tick(now - timer.LastUpdatedUtc) with { LastUpdatedUtc = now }
                : new PhaseTimer(settings.TurnTimer, now),
            TurnPhase.Fortify => new PhaseTimer(settings.FortifyTimer, now),
            _ => throw new ArgumentOutOfRangeException(nameof(nextPhase), nextPhase, "Onbekende beurtfase."),
        };
}
