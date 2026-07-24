using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class PhaseTimerTests
{
    private static readonly DateTimeOffset Now = new(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Tick_TrektDeVerstrekenTijdAf()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(3), Now);

        var afterTick = timer.Tick(TimeSpan.FromSeconds(30));

        Assert.Equal(TimeSpan.FromSeconds(150), afterTick.Remaining);
    }

    [Fact]
    public void Tick_OpEenGepauzeerdeTimer_VerandertNiets()
    {
        // FO §5.4: de timer staat stil vanaf "Gooi" tot het gevecht is afgehandeld,
        // zodat uitgevoerde aanvallen de aanvaller geen beurttijd kosten.
        var timer = new PhaseTimer(TimeSpan.FromMinutes(3), Now).Pause(TimeSpan.FromMinutes(3), Now);

        var afterTick = timer.Tick(TimeSpan.FromMinutes(10));

        Assert.Equal(TimeSpan.FromMinutes(3), afterTick.Remaining);
        Assert.True(afterTick.IsPaused);
    }

    [Fact]
    public void Tick_LaatDeOorspronkelijkeTimerOngemoeid()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(3), Now);

        timer.Tick(TimeSpan.FromMinutes(1));

        Assert.Equal(TimeSpan.FromMinutes(3), timer.Remaining);
    }

    [Fact]
    public void Tick_VoorbijHetEinde_ZaktNietOnderNul()
    {
        var timer = new PhaseTimer(TimeSpan.FromSeconds(10), Now);

        var afterTick = timer.Tick(TimeSpan.FromMinutes(5));

        Assert.Equal(TimeSpan.Zero, afterTick.Remaining);
        Assert.True(afterTick.IsExpired);
    }

    [Fact]
    public void Tick_MetNegatieveTijd_IsEenBug()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1), Now);

        Assert.Throws<ArgumentOutOfRangeException>(() => timer.Tick(TimeSpan.FromSeconds(-1)));
    }

    [Fact]
    public void EenNieuweTimer_LooptEnIsNietVerlopen()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1), Now);

        Assert.False(timer.IsPaused);
        Assert.False(timer.IsExpired);
    }

    [Fact]
    public void Resume_LaatDeTimerWeerAftellen()
    {
        var resumedAt = Now + TimeSpan.FromMinutes(5);
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1), Now)
            .Pause(TimeSpan.FromMinutes(1), Now)
            .Resume(resumedAt);

        var afterTick = timer.Tick(TimeSpan.FromSeconds(20));

        Assert.False(afterTick.IsPaused);
        Assert.Equal(TimeSpan.FromSeconds(40), afterTick.Remaining);
    }

    [Fact]
    public void Resume_SchuiftLastUpdatedUtcOpMaarLaatRemainingOngemoeid()
    {
        var resumedAt = Now + TimeSpan.FromMinutes(5);
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1), Now)
            .Pause(TimeSpan.FromSeconds(45), Now)
            .Resume(resumedAt);

        Assert.Equal(TimeSpan.FromSeconds(45), timer.Remaining);
        Assert.Equal(resumedAt, timer.LastUpdatedUtc);
    }

    [Fact]
    public void Pause_LaatDeOorspronkelijkeTimerOngemoeid()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1), Now);

        timer.Pause(TimeSpan.FromSeconds(30), Now);

        Assert.False(timer.IsPaused);
    }

    [Fact]
    public void Deadline_IsLastUpdatedUtcPlusRemaining()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(3), Now);

        var deadline = timer.LastUpdatedUtc + timer.Remaining;

        Assert.Equal(Now + TimeSpan.FromMinutes(3), deadline);
    }
}
