using JasperFx;
using JasperFx.Events;

namespace RiskGame.Api.Commands;

/// <summary>
/// Probeert een commando opnieuw als een gelijktijdige append op dezelfde stream het
/// stream-versienummer al had ingenomen. Marten detecteert dat zelf; opnieuw proberen met een
/// verse sessie en een opnieuw geladen state laat het commando beslissen op de state ná de
/// ander. Veilig voor commando's die hun hele beslissing per poging opnieuw nemen — de
/// mislukte poging heeft niets opgeslagen.
/// </summary>
/// <remarks>
/// Een vangnet, niet meer de primaire bescherming: commando's op hetzelfde spel lopen sinds
/// <see cref="GameWriteLock"/> na elkaar, dus een botsende append hoort niet meer voor te komen. Blijft
/// staan waar spelers bewust tegelijk handelen (FO §9.2: de attrition-keuzes, het beurteinde dat een
/// trekking kan starten, auto-pass) — goedkoop, en een onverwachte botsing wordt zo een herhaling in
/// plaats van een foutmelding.
/// </remarks>
public static class ConcurrencyRetry
{
    public const int MaxAttempts = 3;

    public static async Task<T> RunAsync<T>(Func<Task<T>> attempt)
    {
        ArgumentNullException.ThrowIfNull(attempt);

        for (var attemptNumber = 1; ; attemptNumber++)
        {
            try
            {
                return await attempt();
            }
            catch (Exception ex) when (IsConflict(ex) && attemptNumber < MaxAttempts)
            {
                // Opnieuw met een verse sessie — zie de summary.
            }
        }
    }

    /// <summary>
    /// Of <paramref name="ex"/> een botsende gelijktijdige append is — ook voor een aanroeper die na
    /// de laatste poging nog iets anders wil doen dan falen (<c>RejoinGame</c>).
    /// </summary>
    public static bool IsConflict(Exception ex) =>
        ex is ConcurrencyException or EventStreamUnexpectedMaxEventIdException;
}
