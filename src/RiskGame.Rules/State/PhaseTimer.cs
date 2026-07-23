namespace RiskGame.Rules.State;

/// <summary>
/// De resterende tijd van de lopende fase (FO §5.4). De engine houdt bewust géén absolute
/// deadline bij: het aftellen is de verantwoordelijkheid van de API-laag, die verstreken
/// tijd via <see cref="Tick"/> binnenbrengt. Daarmee is de engine ongevoelig voor een
/// verspringende serverklok en zonder tijdbron reproduceerbaar.
/// </summary>
/// <param name="IsPaused">
/// Waar vanaf het moment dat de aanvaller "Gooi" drukt tot het gevecht volledig is
/// afgehandeld; uitgevoerde aanvallen kosten de aanvaller zo geen beurttijd (FO §5.4).
/// </param>
public sealed record PhaseTimer(TimeSpan Remaining, bool IsPaused)
{
    public PhaseTimer(TimeSpan remaining)
        : this(remaining, IsPaused: false)
    {
    }

    public bool IsExpired => Remaining <= TimeSpan.Zero;

    public PhaseTimer Pause() => this with { IsPaused = true };

    public PhaseTimer Resume() => this with { IsPaused = false };

    /// <summary>
    /// Trekt de verstreken tijd af. Een gepauzeerde timer blijft ongewijzigd — dat is de
    /// hele pauzeregel. De resterende tijd zakt nooit onder nul, zodat "hoeveel is er
    /// over" altijd een zinnige waarde is om te tonen.
    /// </summary>
    public PhaseTimer Tick(TimeSpan elapsed)
    {
        if (elapsed < TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(
                nameof(elapsed), elapsed, "Verstreken tijd kan niet negatief zijn.");
        }

        if (IsPaused)
        {
            return this;
        }

        var remaining = Remaining - elapsed;

        return this with { Remaining = remaining < TimeSpan.Zero ? TimeSpan.Zero : remaining };
    }
}
