namespace RiskGame.Api.Services;

/// <summary>
/// Welke spelers verbonden zijn (FO §11.1, TO §4.1): per connectie de speler erachter, en per speler
/// sinds wanneer hij geen enkele connectie meer heeft. Bewust in-memory, net als
/// <see cref="TvPairingRegistry"/>: aanwezigheid is transiënte verbindingsinfo, geen spelfeit. Na een
/// server-herstart is de registry leeg; een speler telt pas als weg nadat hij opnieuw verbonden is
/// geweest en die verbinding weer verliest.
/// </summary>
/// <remarks>
/// Alleen een connectie die zich als speler bewees (<c>JoinGame</c>, of <c>RejoinGame</c> met een
/// geldig sessietoken) wordt geregistreerd — een TV of een telefoon die alleen meekijkt niet. Eén
/// speler kan meerdere connecties hebben (een tweede tabblad); hij is pas weg als de laatste sluit.
/// Een afwezige speler blijft hier staan tot hij terugkomt of tot <see cref="HostAbsenceMonitor"/> hem
/// vergeet omdat zijn spel niet meer loopt (<see cref="Forget"/>).
/// </remarks>
public sealed class PlayerPresenceRegistry(TimeProvider timeProvider)
{
    private readonly Lock _lock = new();
    private readonly Dictionary<string, PlayerKey> _playerByConnection = new(StringComparer.Ordinal);
    private readonly Dictionary<PlayerKey, HashSet<string>> _connectionsByPlayer = [];
    private readonly Dictionary<PlayerKey, DateTimeOffset> _absentSince = [];

    /// <summary>
    /// Koppelt de connectie aan de speler. Hing de connectie al aan een andere speler, dan wordt die
    /// koppeling eerst opgeheven.
    /// </summary>
    public void Register(string connectionId, string gameId, string playerId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(gameId);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        var player = new PlayerKey(gameId, playerId);

        lock (_lock)
        {
            UnregisterLocked(connectionId);

            _playerByConnection[connectionId] = player;

            if (!_connectionsByPlayer.TryGetValue(player, out var connections))
            {
                connections = new HashSet<string>(StringComparer.Ordinal);
                _connectionsByPlayer[player] = connections;
            }

            connections.Add(connectionId);
            _absentSince.Remove(player);
        }
    }

    /// <summary>
    /// Meldt de connectie af (bij het verbreken). Was het de laatste connectie van die speler, dan
    /// is hij vanaf nu weg.
    /// </summary>
    public void Unregister(string connectionId)
    {
        lock (_lock)
        {
            UnregisterLocked(connectionId);
        }
    }

    /// <summary>Of <paramref name="connectionId"/> bewezen bij deze speler in dit spel hoort.</summary>
    public bool IsConnectionOf(string connectionId, string gameId, string playerId)
    {
        lock (_lock)
        {
            return _playerByConnection.TryGetValue(connectionId, out var player)
                && player == new PlayerKey(gameId, playerId);
        }
    }

    /// <summary>
    /// Sinds wanneer de speler geen connectie meer heeft; <c>null</c> als hij verbonden is of sinds
    /// de start van de server nooit verbonden was.
    /// </summary>
    public DateTimeOffset? AbsentSince(string gameId, string playerId)
    {
        lock (_lock)
        {
            return _absentSince.TryGetValue(new PlayerKey(gameId, playerId), out var since) ? since : null;
        }
    }

    /// <summary>
    /// De spelers die al minstens sinds <paramref name="cutoff"/> geen connectie meer hebben — voor de
    /// host-uitval (FO §11.1).
    /// </summary>
    public IReadOnlyList<(string GameId, string PlayerId)> AbsentPlayers(DateTimeOffset cutoff)
    {
        lock (_lock)
        {
            return [.. _absentSince
                .Where(entry => entry.Value <= cutoff)
                .Select(entry => (entry.Key.GameId, entry.Key.PlayerId))];
        }
    }

    /// <summary>
    /// Vergeet een afwezige speler — voor spellen die niet meer lopen, zodat de lijst niet onbegrensd
    /// groeit. Een speler die intussen opnieuw verbond, blijft staan.
    /// </summary>
    public void Forget(string gameId, string playerId)
    {
        lock (_lock)
        {
            _absentSince.Remove(new PlayerKey(gameId, playerId));
        }
    }

    private void UnregisterLocked(string connectionId)
    {
        if (!_playerByConnection.Remove(connectionId, out var player))
        {
            return;
        }

        var connections = _connectionsByPlayer[player];
        connections.Remove(connectionId);

        if (connections.Count == 0)
        {
            _connectionsByPlayer.Remove(player);
            _absentSince[player] = timeProvider.GetUtcNow();
        }
    }

    private readonly record struct PlayerKey(string GameId, string PlayerId);
}
