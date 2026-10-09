namespace PartyLink.Server.Presence;

/// <summary>
/// Tracks which players are connected: per connection the player behind it, and per player since
/// when they have had no connection at all. Deliberately in-memory: presence is transient connection
/// information, not room state. After a server restart the registry is empty; a player only counts as
/// absent after reconnecting once and losing that connection again.
/// </summary>
/// <remarks>
/// Register only connections that proved to be a player (a join, or a rejoin with a valid session
/// token) — not a display or a phone that is only watching. One player can have several connections
/// (a second tab); they only count as absent once the last one closes. An absent player stays listed
/// until they return or until the host application forgets them (<see cref="Forget"/>), for example
/// because their room has ended.
/// </remarks>
public sealed class PlayerPresenceRegistry(TimeProvider timeProvider)
{
    private readonly Lock _lock = new();
    private readonly Dictionary<string, PlayerKey> _playerByConnection = new(StringComparer.Ordinal);
    private readonly Dictionary<PlayerKey, HashSet<string>> _connectionsByPlayer = [];
    private readonly Dictionary<PlayerKey, DateTimeOffset> _absentSince = [];

    /// <summary>
    /// Binds the connection to the player. If the connection was already bound to another player, that
    /// binding is released first and returned, so the caller can also leave that player's groups.
    /// </summary>
    public (string RoomId, string PlayerId)? Register(string connectionId, string roomId, string playerId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionId);
        ArgumentException.ThrowIfNullOrWhiteSpace(roomId);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        var player = new PlayerKey(roomId, playerId);

        lock (_lock)
        {
            (string RoomId, string PlayerId)? previous =
                _playerByConnection.TryGetValue(connectionId, out var existing) ? (existing.RoomId, existing.PlayerId) : null;

            UnregisterLocked(connectionId);

            _playerByConnection[connectionId] = player;

            if (!_connectionsByPlayer.TryGetValue(player, out var connections))
            {
                connections = new HashSet<string>(StringComparer.Ordinal);
                _connectionsByPlayer[player] = connections;
            }

            connections.Add(connectionId);
            _absentSince.Remove(player);

            return previous;
        }
    }

    /// <summary>The connections currently proven to belong to this player (a copy; empty if not connected).</summary>
    public IReadOnlyList<string> ConnectionsOf(string roomId, string playerId)
    {
        lock (_lock)
        {
            return _connectionsByPlayer.TryGetValue(new PlayerKey(roomId, playerId), out var connections)
                ? [.. connections]
                : [];
        }
    }

    /// <summary>
    /// Unbinds the connection (on disconnect). If it was the player's last connection, the player is
    /// absent from now on.
    /// </summary>
    public void Unregister(string connectionId)
    {
        lock (_lock)
        {
            UnregisterLocked(connectionId);
        }
    }

    /// <summary>Whether <paramref name="connectionId"/> is proven to belong to this player in this room.</summary>
    public bool IsConnectionOf(string connectionId, string roomId, string playerId)
    {
        lock (_lock)
        {
            return _playerByConnection.TryGetValue(connectionId, out var player)
                && player == new PlayerKey(roomId, playerId);
        }
    }

    /// <summary>
    /// Since when the player has had no connection; <c>null</c> if they are connected or have never
    /// been connected since the server started.
    /// </summary>
    public DateTimeOffset? AbsentSince(string roomId, string playerId)
    {
        lock (_lock)
        {
            return _absentSince.TryGetValue(new PlayerKey(roomId, playerId), out var since) ? since : null;
        }
    }

    /// <summary>The players that have had no connection since at least <paramref name="cutoff"/>.</summary>
    public IReadOnlyList<(string RoomId, string PlayerId)> AbsentPlayers(DateTimeOffset cutoff)
    {
        lock (_lock)
        {
            return [.. _absentSince
                .Where(entry => entry.Value <= cutoff)
                .Select(entry => (entry.Key.RoomId, entry.Key.PlayerId))];
        }
    }

    /// <summary>
    /// Forgets an absent player — for rooms that have ended, so the list does not grow without bound.
    /// A player who has reconnected in the meantime stays listed.
    /// </summary>
    public void Forget(string roomId, string playerId)
    {
        lock (_lock)
        {
            _absentSince.Remove(new PlayerKey(roomId, playerId));
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

    private readonly record struct PlayerKey(string RoomId, string PlayerId);
}
