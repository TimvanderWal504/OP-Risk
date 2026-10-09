using System.Security.Cryptography;

namespace PartyLink.Server.Rooms;

/// <summary>
/// Generates the short codes people type or scan to reach a room or a display: six characters from an
/// alphabet without easily confused characters (no 0/O, 1/I).
/// </summary>
/// <remarks>
/// A code is the only thing standing between a stranger and a room, so it comes from a
/// cryptographically secure source: codes from a predictable generator could be guessed from codes
/// seen earlier.
/// </remarks>
public static class RoomCodeGenerator
{
    public const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    public const int Length = 6;

    public static string NewCode() => new(RandomNumberGenerator.GetItems<char>(Alphabet, Length));
}
