using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;
using PartyLink.Server.Rooms;

namespace PartyLink.Server.Pairing;

/// <summary>
/// Pairing codes of displays that are still waiting for a room: the display requests a code, shows it
/// as a QR code, and a phone sends a room code back through it. Deliberately in-memory and per
/// connection: a pairing is transient, not room state. After a server restart or a reconnect the
/// display simply requests a new code.
/// </summary>
public sealed class DisplayPairingRegistry
{
    private readonly ConcurrentDictionary<string, string> _connectionByCode = new();
    private readonly ConcurrentDictionary<string, string> _codeByConnection = new();

    /// <summary>Gives the connection a new code; an earlier code of the same connection expires.</summary>
    /// <remarks>
    /// The reverse mapping is in place before the code becomes claimable: a concurrent
    /// <see cref="TryClaim"/> then always finds both sides and never leaves a half-removed registration.
    /// </remarks>
    public string Register(string connectionId)
    {
        Remove(connectionId);

        string code;

        do
        {
            code = RoomCodeGenerator.NewCode();
            _codeByConnection[connectionId] = code;
        }
        while (!_connectionByCode.TryAdd(code, connectionId));

        return code;
    }

    /// <summary>
    /// Claims the code: usable once, so a scanned QR code cannot later send a second room to the same
    /// display.
    /// </summary>
    public bool TryClaim(string code, [MaybeNullWhen(false)] out string connectionId)
    {
        // Codes are issued in upper case; this way the conditional removal below also matches a code
        // typed by hand in lower case.
        code = code.ToUpperInvariant();

        if (!_connectionByCode.TryRemove(code, out connectionId))
        {
            return false;
        }

        // Only if the connection still points to this code: a concurrent new registration of the same
        // display must not lose its fresh code.
        _codeByConnection.TryRemove(new KeyValuePair<string, string>(connectionId, code));

        return true;
    }

    public void Remove(string connectionId)
    {
        if (_codeByConnection.TryRemove(connectionId, out var code))
        {
            _connectionByCode.TryRemove(new KeyValuePair<string, string>(code, connectionId));
        }
    }
}
