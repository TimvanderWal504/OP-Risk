using Marten;
using RiskGame.Rules.State;

namespace RiskGame.Api.Commands;

/// <summary>
/// Laadt een spel om er een commando op uit te voeren, en zorgt dat commando's op hetzelfde spel na
/// elkaar lopen (TO §5.2). Zonder dit kunnen twee gelijktijdige commando's allebei op dezelfde state
/// beslissen en allebei opslaan: Marten bepaalt het versienummer van een append pas bij het opslaan,
/// dus de tweede botst niet — hij negeert alleen de beslissing van de eerste (een lost update).
/// </summary>
/// <remarks>
/// Een Postgres advisory lock per spel, binnen de transactie van de sessie: vrij bij
/// <c>SaveChangesAsync</c> (commit) of bij het disposen van de sessie zonder opslaan (rollback). Geldt
/// over serverinstanties heen, en raakt alleen commando's op hetzelfde spel. Een commando neemt
/// nooit twee spel-locks, dus deadlocks tussen spellen bestaan niet. Lezen (hub, timer-service) gaat
/// er gewoon langs.
/// <para>
/// De lock gebruikt de variant met twee sleutels (<see cref="LockNamespace"/>, hash van het spel-id):
/// die sleutelruimte overlapt niet met die van locks op één bigint, zoals Marten ze zelf gebruikt.
/// Wachten duurt hooguit <see cref="LockTimeout"/>: een commando duurt normaal milliseconden, dus een
/// langere wachttijd betekent een houder die blijft hangen — dan liever een fout dan een spel dat stil
/// blijft staan.
/// </para>
/// </remarks>
public static class GameWriteLock
{
    /// <summary>De eerste sleutel van elke spel-lock ("RISK" in ASCII), zodat ze niet botsen met andere advisory locks.</summary>
    private const int LockNamespace = 0x5249534B;

    private const string LockTimeout = "10s";

    /// <summary>
    /// Opent een transactie op <paramref name="session"/>, wacht op de lock van
    /// <paramref name="gameId"/> en laadt dan pas de state — zo is die state bij het opslaan nog actueel.
    /// </summary>
    public static async Task<GameState?> LoadForWritingAsync(
        this IDocumentSession session, string gameId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentException.ThrowIfNullOrWhiteSpace(gameId);

        await session.BeginTransactionAsync(cancellationToken);

        // Alleen voor deze transactie (is_local = true).
        await session.QueryAsync<string>(
            "select set_config('lock_timeout', ?, true)", cancellationToken, LockTimeout);
        await session.QueryAsync<int>(
            "select 1 from (select pg_advisory_xact_lock(?, hashtext(?))) as game_lock",
            cancellationToken,
            LockNamespace,
            gameId);

        return await session.LoadAsync<GameState>(gameId, cancellationToken);
    }
}
