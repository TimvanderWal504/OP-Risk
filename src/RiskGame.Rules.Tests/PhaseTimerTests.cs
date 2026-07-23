using RiskGame.Rules.State;

namespace RiskGame.Rules.Tests;

public class PhaseTimerTests
{
    [Fact]
    public void Tick_TrektDeVerstrekenTijdAf()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(3));

        var afterTick = timer.Tick(TimeSpan.FromSeconds(30));

        Assert.Equal(TimeSpan.FromSeconds(150), afterTick.Remaining);
    }

    [Fact]
    public void Tick_OpEenGepauzeerdeTimer_VerandertNiets()
    {
        // FO §5.4: de timer staat stil vanaf "Gooi" tot het gevecht is afgehandeld,
        // zodat uitgevoerde aanvallen de aanvaller geen beurttijd kosten.
        var timer = new PhaseTimer(TimeSpan.FromMinutes(3)).Pause();

        var afterTick = timer.Tick(TimeSpan.FromMinutes(10));

        Assert.Equal(TimeSpan.FromMinutes(3), afterTick.Remaining);
        Assert.True(afterTick.IsPaused);
    }

    [Fact]
    public void Tick_LaatDeOorspronkelijkeTimerOngemoeid()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(3));

        timer.Tick(TimeSpan.FromMinutes(1));

        Assert.Equal(TimeSpan.FromMinutes(3), timer.Remaining);
    }

    [Fact]
    public void Tick_VoorbijHetEinde_ZaktNietOnderNul()
    {
        var timer = new PhaseTimer(TimeSpan.FromSeconds(10));

        var afterTick = timer.Tick(TimeSpan.FromMinutes(5));

        Assert.Equal(TimeSpan.Zero, afterTick.Remaining);
        Assert.True(afterTick.IsExpired);
    }

    [Fact]
    public void Tick_MetNegatieveTijd_IsEenBug()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1));

        Assert.Throws<ArgumentOutOfRangeException>(() => timer.Tick(TimeSpan.FromSeconds(-1)));
    }

    [Fact]
    public void EenNieuweTimer_LooptEnIsNietVerlopen()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1));

        Assert.False(timer.IsPaused);
        Assert.False(timer.IsExpired);
    }

    [Fact]
    public void Resume_LaatDeTimerWeerAftellen()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1)).Pause().Resume();

        var afterTick = timer.Tick(TimeSpan.FromSeconds(20));

        Assert.False(afterTick.IsPaused);
        Assert.Equal(TimeSpan.FromSeconds(40), afterTick.Remaining);
    }

    [Fact]
    public void Pause_LaatDeOorspronkelijkeTimerOngemoeid()
    {
        var timer = new PhaseTimer(TimeSpan.FromMinutes(1));

        timer.Pause();

        Assert.False(timer.IsPaused);
    }
}
