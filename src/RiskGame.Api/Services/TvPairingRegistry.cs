using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;

namespace RiskGame.Api.Services;

/// <summary>
/// Koppelcodes van TV's die nog op een spel wachten ("TV opzetten" op de startpagina): de TV
/// vraagt een code aan, toont die als QR, en de host-telefoon stuurt via die code een spelcode
/// terug. Bewust in-memory en per connectie: een koppeling is transiënt, geen spel-state — ze
/// hoort niet in de event store. Na een server-herstart of reconnect vraagt de TV gewoon een
/// nieuwe code aan.
/// </summary>
public sealed class TvPairingRegistry
{
    private readonly ConcurrentDictionary<string, string> _connectionByCode = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, string> _codeByConnection = new();

    /// <summary>Geeft de connectie een nieuwe code; een eerdere code van dezelfde connectie vervalt.</summary>
    public string Register(string connectionId)
    {
        Remove(connectionId);

        string code;

        do
        {
            code = GameIdGenerator.NewGameId();
        }
        while (!_connectionByCode.TryAdd(code, connectionId));

        _codeByConnection[connectionId] = code;

        return code;
    }

    /// <summary>
    /// Neemt de code in: eenmalig bruikbaar, zodat een gescande QR niet later nog een tweede spel
    /// naar dezelfde TV kan sturen.
    /// </summary>
    public bool TryClaim(string code, [MaybeNullWhen(false)] out string connectionId)
    {
        if (!_connectionByCode.TryRemove(code, out connectionId))
        {
            return false;
        }

        _codeByConnection.TryRemove(connectionId, out _);

        return true;
    }

    public void Remove(string connectionId)
    {
        if (_codeByConnection.TryRemove(connectionId, out var code))
        {
            _connectionByCode.TryRemove(code, out _);
        }
    }
}
