namespace RiskGame.Rules.State;

/// <summary>
/// Weergave-instellingen van het TV-scherm, door de host bediend vanaf de telefoon
/// (plan-testronde-tv punt 2). Geen spelregel: puur hoe de TV het spel toont, maar wel per spel
/// server-side vastgelegd zodat een herladen TV dezelfde weergave terugkrijgt.
/// </summary>
/// <remarks>
/// De drie schaalwaarden zijn sliderposities (<see cref="MinValue"/>–<see cref="MaxValue"/>, in
/// stappen van <see cref="Step"/>), geen vermenigvuldigers: <see cref="DesignValue"/> is het
/// huidige design. De omrekening naar een factor is presentatie en gebeurt in de frontend
/// (<c>frontend/src/styles/tvDisplay.ts</c>) — zo blijven hier alleen ints (src/CLAUDE.md).
/// </remarks>
public sealed record TvDisplaySettings(int TextScale, int GlassOpacity, int GlassBlur, TvLanguage Language)
{
    public const int MinValue = 0;
    public const int MaxValue = 100;
    public const int Step = 5;
    public const int DesignValue = 50;

    public static TvDisplaySettings Default { get; } =
        new(DesignValue, DesignValue, DesignValue, TvLanguage.Nl);
}

/// <summary>De taal van het TV-scherm — los van de taal van de telefoons (plan-testronde-tv punt 2/8).</summary>
public enum TvLanguage
{
    Nl,
    En,
}
