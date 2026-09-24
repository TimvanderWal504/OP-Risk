namespace RiskGame.Api.Dtos;

/// <summary>
/// Draad-representatie van <see cref="RiskGame.Rules.State.TvDisplaySettings"/> (plan-testronde-tv
/// punt 2): sliderposities 0–100 in stappen van 5, 50 = het huidige design. De omrekening naar een
/// factor gebeurt client-side (<c>frontend/src/styles/tvDisplay.ts</c>).
/// </summary>
public sealed record TvDisplaySettingsDto(int TextScale, int GlassOpacity, int GlassBlur, TvLanguageDto Language);

/// <summary>Draad-representatie van <see cref="RiskGame.Rules.State.TvLanguage"/>.</summary>
public enum TvLanguageDto
{
    Nl,
    En,
}
