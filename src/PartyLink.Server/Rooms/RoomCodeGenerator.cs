namespace PartyLink.Server.Rooms;

/// <summary>
/// Generates the short codes people type or scan to reach a room or a display: six characters from an
/// alphabet without easily confused characters (no 0/O, 1/I).
/// </summary>
public static class RoomCodeGenerator
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int Length = 6;

    public static string NewCode() =>
        string.Create(Length, 0, (span, _) =>
        {
            for (var i = 0; i < span.Length; i++)
            {
                span[i] = Alphabet[Random.Shared.Next(Alphabet.Length)];
            }
        });
}
