namespace RiskGame.Rules.Validation;

/// <summary>
/// De uitkomst van een regelcontrole zonder terug te geven waarde: mag deze zet, ja of
/// nee. De waardedragende tegenhanger is <see cref="Results.Result{T}"/>.
/// </summary>
/// <remarks>
/// "Deze zet mag niet" is een normale uitkomst en hoort hier; exceptions blijven
/// voorbehouden aan bugs en onmogelijke toestanden. Alle fouten worden verzameld, niet
/// alleen de eerste, zodat een speler in één keer ziet wat er mis is.
/// </remarks>
public sealed class ValidationResult
{
    private static readonly ValidationResult Ok = new([]);

    private ValidationResult(IReadOnlyList<string> errors) => Errors = errors;

    public IReadOnlyList<string> Errors { get; }

    public bool IsSuccess => Errors.Count == 0;

    public static ValidationResult Success() => Ok;

    public static ValidationResult Failure(string error)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(error);

        return new ValidationResult([error]);
    }

    /// <summary>
    /// Voegt meerdere uitkomsten samen tot één; slaagt alleen als ze allemaal slagen.
    /// Zo kan een commando zijn guards achter elkaar zetten en de speler in één keer
    /// alles melden wat er niet klopt.
    /// </summary>
    public static ValidationResult Combine(params ValidationResult[] results)
    {
        ArgumentNullException.ThrowIfNull(results);

        var errors = results.SelectMany(result => result.Errors).ToArray();

        return errors.Length == 0 ? Ok : new ValidationResult(errors);
    }
}
