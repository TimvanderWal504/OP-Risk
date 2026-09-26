using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;

namespace RiskGame.Api.Services;

/// <summary>
/// Koppelcodes van TV's die nog op een spel wachten ("TV koppelen" op de startpagina): de TV
/// vraagt een code aan, toont die als QR, en de host-telefoon stuurt via die code een spelcode
/// terug. Bewust in-memory en per connectie: een koppeling is transiënt, geen spel-state — ze
/// hoort niet in de event store. Na een server-herstart of reconnect vraagt de TV gewoon een
/// nieuwe code aan.
/// </summary>
public sealed class TvPairingRegistry
{
    private readonly ConcurrentDictionary<string, string> _connectionByCode = new();
    private readonly ConcurrentDictionary<string, string> _codeByConnection = new();

    /// <summary>Geeft de connectie een nieuwe code; een eerdere code van dezelfde connectie vervalt.</summary>
    /// <remarks>
    /// De omgekeerde koppeling staat vast vóórdat de code claimbaar wordt: een gelijktijdige
    /// <see cref="TryClaim"/> vindt dan altijd beide kanten, en laat geen half opgeruimde
    /// registratie achter.
    /// </remarks>
    public string Register(string connectionId)
    {
        Remove(connectionId);

        string code;

        do
        {
            code = GameIdGenerator.NewGameId();
            _codeByConnection[connectionId] = code;
        }
        while (!_connectionByCode.TryAdd(code, connectionId));

        return code;
    }

    /// <summary>
    /// Neemt de code in: eenmalig bruikbaar, zodat een gescande QR niet later nog een tweede spel
    /// naar dezelfde TV kan sturen.
    /// </summary>
    public bool TryClaim(string code, [MaybeNullWhen(false)] out string connectionId)
    {
        // Codes worden in hoofdletters uitgegeven; zo matcht de voorwaardelijke verwijdering
        // hieronder ook een met de hand ingetypte code in kleine letters.
        code = code.ToUpperInvariant();

        if (!_connectionByCode.TryRemove(code, out connectionId))
        {
            return false;
        }

        // Alleen als de connectie nog naar déze code wijst: een gelijktijdige nieuwe registratie
        // van dezelfde TV mag zijn verse code niet kwijtraken.
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
