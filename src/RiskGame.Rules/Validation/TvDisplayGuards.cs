using RiskGame.Rules.State;

namespace RiskGame.Rules.Validation;

/// <summary>De controles op <see cref="TvDisplaySettings"/> (plan-testronde-tv punt 2).</summary>
public static class TvDisplayGuards
{
    /// <summary>
    /// Elke schaalwaarde ligt binnen <see cref="TvDisplaySettings.MinValue"/>–<see cref="TvDisplaySettings.MaxValue"/>
    /// en valt op een stap van <see cref="TvDisplaySettings.Step"/>; de taal is een bekende waarde.
    /// </summary>
    public static ValidationResult ValuesAreValid(TvDisplaySettings settings)
    {
        ArgumentNullException.ThrowIfNull(settings);

        var valid = IsValidScale(settings.TextScale)
            && IsValidScale(settings.GlassOpacity)
            && IsValidScale(settings.GlassBlur)
            && Enum.IsDefined(settings.Language);

        return valid ? ValidationResult.Success() : ValidationResult.Failure("tvDisplay.invalidValue");
    }

    private static bool IsValidScale(int value) =>
        value is >= TvDisplaySettings.MinValue and <= TvDisplaySettings.MaxValue
        && value % TvDisplaySettings.Step == 0;
}
