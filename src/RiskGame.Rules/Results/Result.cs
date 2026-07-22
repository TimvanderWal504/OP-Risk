namespace RiskGame.Rules.Results;

/// <summary>
/// Uitkomst van een bewerking die kan mislukken door een data- of regelfout.
/// Exceptions zijn voorbehouden aan bugs en onmogelijke toestanden; "dit klopt niet"
/// hoort hier. Alle fouten worden verzameld, niet alleen de eerste, zodat een
/// gebruiker in één keer ziet wat er mis is.
/// </summary>
public sealed class Result<T>
{
    private readonly T? _value;

    private Result(T value)
    {
        _value = value;
        Errors = [];
    }

    private Result(IReadOnlyList<string> errors)
    {
        _value = default;
        Errors = errors;
    }

    public IReadOnlyList<string> Errors { get; }

    public bool IsSuccess => Errors.Count == 0;

    /// <summary>De waarde. Alleen geldig als <see cref="IsSuccess"/> waar is.</summary>
    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException(
            "Value opgevraagd op een mislukt Result. Controleer eerst IsSuccess.");

    public static Result<T> Success(T value) => new(value);

    public static Result<T> Failure(IReadOnlyList<string> errors)
    {
        if (errors.Count == 0)
        {
            throw new ArgumentException(
                "Een mislukt Result moet minstens één fout bevatten.", nameof(errors));
        }

        return new Result<T>(errors);
    }

    public static Result<T> Failure(string error) => Failure([error]);
}
