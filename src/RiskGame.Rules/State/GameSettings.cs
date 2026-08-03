namespace RiskGame.Rules.State;

/// <summary>
/// De lobby-instellingen van één spel (FO §10). Alles wat een getal of een aan/uit-keuze
/// is staat hier, zodat er verderop in de engine geen losse magic numbers nodig zijn.
/// </summary>
/// <param name="StartingArmiesPresetId">
/// Welke startlegers-preset (FO §5.1/§10, bv. "classic") de host koos bij het aanmaken.
/// Het exacte aantal per speler hangt af van het spelersaantal, dat pas vaststaat zodra de
/// lobby sluit — vandaar dat hier alleen de preset-id staat, niet een vast getal. Zie
/// <see cref="TurnFlow.StartingArmiesResolver"/> voor het opgeloste aantal.
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
/// <param name="RoleAssignment">
/// Random of Kiezen (FO §10); betekenisloos zolang <paramref name="RolesEnabled"/> uit staat.
/// </param>
public sealed record GameSettings(
    WinCondition WinCondition,
    SetupMode SetupMode,
    string StartingArmiesPresetId,
    TimeSpan TurnTimer,
    TimeSpan FortifyTimer,
    bool RolesEnabled,
    RoleAssignmentMode RoleAssignment,
    bool EventsEnabled);
