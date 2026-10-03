using Marten;
using RiskGame.Persistence.Sessions;
using RiskGame.Rules.Results;

namespace RiskGame.Api.Commands;

/// <summary>De speler die is overgenomen en diens nieuwe sessietoken (TO §6.3).</summary>
public sealed record ReclaimedSession(string PlayerId, string SessionToken);

/// <summary>
/// Sessie-identiteit van spelers (TO §6.3): een speler neemt zijn positie over op een ander tabblad of
/// apparaat. Raakt de event store niet — een sessietoken is verbindingsidentiteit, geen spelfeit.
/// </summary>
public sealed class PlayerSessionCommandHandler(IDocumentStore store)
{
    /// <summary>
    /// Koppelt <paramref name="playerName"/> aan een nieuw sessietoken en maakt het oude daarmee
    /// ongeldig (zelfde document-id, dus Marten vervangt het). Een naam is publiek en niet uniek, dus
    /// een naam die niet precies één speler aanwijst wordt geweigerd i.p.v. geraden. Via
    /// <see cref="GameWriteLock"/> omdat dit schrijft: twee gelijktijdige overnames lopen na elkaar en
    /// het laatste token wint zonder dat beide ermee wegkomen.
    /// </summary>
    public async Task<Result<ReclaimedSession>> ReclaimPlayerAsync(string gameId, string playerName)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadForWritingAsync(gameId);

        if (state is null)
        {
            return Result<ReclaimedSession>.Failure("common.unknownGame", new Dictionary<string, string> { ["gameId"] = gameId });
        }

        var wanted = playerName.Trim();
        var matches = state.Players
            .Where(player => string.Equals(player.Name.Trim(), wanted, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (matches.Count == 0)
        {
            return Result<ReclaimedSession>.Failure("common.unknownPlayerName", new Dictionary<string, string> { ["name"] = wanted });
        }

        if (matches.Count > 1)
        {
            return Result<ReclaimedSession>.Failure("common.ambiguousPlayerName", new Dictionary<string, string> { ["name"] = wanted });
        }

        var playerId = matches[0].Id;
        var sessionToken = Guid.NewGuid().ToString();
        session.Store(new PlayerSessionToken(playerId, gameId, sessionToken));
        await session.SaveChangesAsync();

        return Result<ReclaimedSession>.Success(new ReclaimedSession(playerId, sessionToken));
    }
}
