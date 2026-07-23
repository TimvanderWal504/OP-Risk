namespace RiskGame.Rules.State;

/// <summary>
/// De lobby-instellingen van één spel (FO §10). Alles wat een getal of een aan/uit-keuze
/// is staat hier, zodat er verderop in de engine geen losse magic numbers nodig zijn.
/// </summary>
/// <param name="StartingArmies">
/// Startlegers per speler; klassiek 40/35/30/25/20 voor 2–6 spelers en 18 bij 7 (FO §5.1).
/// Het aantal hoort bij het spelersaantal en wordt daarom bij het aanmaken vastgelegd,
/// niet in de engine berekend.
/// </param>
/// <param name="TurnTimer">
/// Loopt over Versterken én Aanvallen samen — één doorlopende timer over twee fases,
/// niet per fase. Standaard 3 minuten; loopt hij af, dan springt de beurt naar
/// Verplaatsen (FO §5.4).
/// </param>
/// <param name="FortifyTimer">
/// Wordt gezet bij het ingaan van Verplaatsen, regulier óf door een verlopen
/// <paramref name="TurnTimer"/>. Standaard 1 minuut; loopt hij af, dan eindigt de beurt
/// (FO §5.4).
/// </param>
public sealed record GameSettings(
    WinCondition WinCondition,
    SetupMode SetupMode,
    int StartingArmies,
    TimeSpan TurnTimer,
    TimeSpan FortifyTimer,
    bool RolesEnabled,
    bool EventsEnabled);
