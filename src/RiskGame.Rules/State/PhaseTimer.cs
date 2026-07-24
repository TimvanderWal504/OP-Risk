namespace RiskGame.Rules.State;

/// <summary>
/// De resterende tijd van de lopende fase (FO §5.4). De engine houdt bewust géén eigen
/// klok bij: <see cref="LastUpdatedUtc"/> is puur meegegeven data (het tijdstip waarop
/// <see cref="Remaining"/> voor het laatst is vastgesteld), nooit door de engine zelf
/// opgevraagd. De API-laag berekent de deadline (<see cref="LastUpdatedUtc"/> +
/// <see cref="Remaining"/>) en brengt verstreken tijd via <see cref="Tick"/> binnen.
/// Daarmee is de engine ongevoelig voor een verspringende serverklok en zonder tijdbron
/// reproduceerbaar.
/// </summary>
/// <param name="IsPaused">
/// Waar vanaf het moment dat de aanvaller "Gooi" drukt tot het gevecht volledig is
/// afgehandeld; uitgevoerde aanvallen kosten de aanvaller zo geen beurttijd (FO §5.4).
/// </param>
/// <param name="LastUpdatedUtc">
/// Tijdstip waarop <see cref="Remaining"/> is vastgesteld — door de API-laag gestempeld
/// met haar eigen klok op het moment dat het event ontstond, nooit door Marten's
/// databaseklok (clock skew tussen app en Postgres zou de deadline stelselmatig laten
/// verschuiven). De deadline is <c>LastUpdatedUtc + Remaining</c>.
/// </param>
public sealed record PhaseTimer(TimeSpan Remaining, bool IsPaused, DateTimeOffset LastUpdatedUtc)
{
    public PhaseTimer(TimeSpan remaining, DateTimeOffset lastUpdatedUtc)
        : this(remaining, IsPaused: false, lastUpdatedUtc)
    {
    }

    public bool IsExpired => Remaining <= TimeSpan.Zero;

    /// <summary>Bevriest <paramref name="remaining"/> op het moment van pauzeren (FO §5.4).</summary>
    public PhaseTimer Pause(TimeSpan remaining, DateTimeOffset now) =>
        this with { Remaining = remaining, IsPaused = true, LastUpdatedUtc = now };

    /// <summary>
    /// Hervat het aftellen. <see cref="Remaining"/> blijft ongewijzigd — dat is precies het
    /// bevroren bedrag van <see cref="Pause"/> — alleen <see cref="LastUpdatedUtc"/> schuift
    /// op, zodat de deadline vanaf nu weer correct doortelt.
    /// </summary>
    public PhaseTimer Resume(DateTimeOffset now) => this with { IsPaused = false, LastUpdatedUtc = now };

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
