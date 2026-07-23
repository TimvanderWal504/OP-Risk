namespace RiskGame.Api;

/// <summary>
/// Genereert een gamecode (FO §2.1: QR-code/code om te joinen). Geen <c>IRandomSource</c>
/// nodig — dat is voor spel-dobbelen dat de rules engine reproduceerbaar moet kunnen
/// testen (TO §4.2); een gamecode is geen spelworp.
/// </summary>
public static class GameIdGenerator
{
    private const string Alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int Length = 6;

    public static string NewGameId() =>
        string.Create(Length, 0, (span, _) =>
        {
            for (var i = 0; i < span.Length; i++)
            {
                span[i] = Alphabet[Random.Shared.Next(Alphabet.Length)];
            }
        });
}
