using JasperFx;
using JasperFx.Events;
using RiskGame.Api.Commands;

namespace RiskGame.Api.Tests;

/// <summary>
/// <see cref="ConcurrencyRetry"/> los van een echte race: welke fouten opnieuw geprobeerd worden,
/// hoe vaak, en dat een gewone fout niet wordt ingeslikt. De race zelf (twee gelijktijdige
/// laatste attrition-keuzes) staat in <see cref="GameHubEventRoundTests"/>.
/// </summary>
public sealed class ConcurrencyRetryTests
{
    public static TheoryData<Func<Exception>> Conflicts => new()
    {
        () => new ConcurrencyException("conflict", typeof(object), "game-1"),
        () => new EventStreamUnexpectedMaxEventIdException("game-1", typeof(object), 2, 1),
    };

    [Theory]
    [MemberData(nameof(Conflicts))]
    public async Task EenConflict_WordtOpnieuwGeprobeerd_EnLevertDeVolgendePoging(Func<Exception> conflict)
    {
        var attempts = 0;

        var result = await ConcurrencyRetry.RunAsync(() =>
        {
            attempts++;

            return attempts == 1 ? throw conflict() : Task.FromResult("tweede poging");
        });

        Assert.Equal("tweede poging", result);
        Assert.Equal(2, attempts);
    }

    [Fact]
    public async Task AanhoudendConflict_GeeftNaHetMaximumOp()
    {
        var attempts = 0;

        await Assert.ThrowsAsync<ConcurrencyException>(() => ConcurrencyRetry.RunAsync<string>(() =>
        {
            attempts++;

            throw new ConcurrencyException("conflict", typeof(object), "game-1");
        }));

        Assert.Equal(ConcurrencyRetry.MaxAttempts, attempts);
    }

    [Fact]
    public async Task EenAndereFout_WordtNietOpnieuwGeprobeerd()
    {
        var attempts = 0;

        await Assert.ThrowsAsync<InvalidOperationException>(() => ConcurrencyRetry.RunAsync<string>(() =>
        {
            attempts++;

            throw new InvalidOperationException("bug");
        }));

        Assert.Equal(1, attempts);
    }
}
