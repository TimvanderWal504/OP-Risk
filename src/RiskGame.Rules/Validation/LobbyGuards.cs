using RiskGame.Rules.State;

namespace RiskGame.Rules.Validation;

/// <summary>
/// De controles die specifiek bij de lobby-fase horen (FO §2.2, TO §4.1: <c>JoinGame</c>,
/// <c>ChooseColor</c>).
/// </summary>
public static class LobbyGuards
{
    /// <summary>FO §5.1: 2 tot 7 spelers; minder dan 2 kan het spel niet starten.</summary>
    private const int MinimumPlayers = 2;

    public static ValidationResult GameIsInLobby(GameState state) =>
        Guards.IsInPhase(state, GamePhase.Lobby);

    /// <summary>Of <paramref name="playerId"/> de host is (FO §2.1) — alleen die mag <c>StartGame</c>.</summary>
    public static ValidationResult CallerIsHost(GameState state, string playerId)
    {
        var exists = Guards.PlayerExists(state, playerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return state.Player(playerId).IsHost
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Speler '{playerId}' is geen host.");
    }

    public static ValidationResult HasMinimumPlayers(GameState state) =>
        state.Players.Count >= MinimumPlayers
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Er zijn minimaal {MinimumPlayers} spelers nodig om te starten.");

    /// <summary>
    /// Of iedereen al een kleur heeft gekozen (FO §3: kleur kiezen gebeurt vóór het
    /// wachten in de lobby, dus dit hoort ook bij <c>StartGame</c>).
    /// </summary>
    public static ValidationResult AllPlayersHaveChosenColor(GameState state) =>
        state.Players.All(player => player.ColorId is not null)
            ? ValidationResult.Success()
            : ValidationResult.Failure("Niet alle spelers hebben al een kleur gekozen.");

    public static ValidationResult ColorIsKnown(GameState state, string colorId) =>
        state.Map.Colors.Any(color => color.Id == colorId)
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Onbekende kleur '{colorId}'.");

    /// <summary>Of nog geen enkele speler deze kleur al gekozen heeft (FO §2.2).</summary>
    public static ValidationResult ColorIsAvailable(GameState state, string colorId) =>
        state.Players.Any(player => player.ColorId == colorId)
            ? ValidationResult.Failure($"Kleur '{colorId}' is al gekozen.")
            : ValidationResult.Success();

    /// <summary>
    /// Of er nog een kleur over is om aan een nieuwe speler te geven — het aantal
    /// spelerskleuren van de kaartvariant is de harde grens aan het aantal deelnemers.
    /// </summary>
    public static ValidationResult SlotIsAvailable(GameState state) =>
        state.Players.Count < state.Map.Colors.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure("Dit spel zit vol.");

    /// <summary>
    /// Rolkeuze (FO §8) bestaat alleen als rollen aanstaan én de lobby-instelling op
    /// <see cref="RoleAssignmentMode.Choose"/> staat — bij <see cref="RoleAssignmentMode.Random"/>
    /// gebeurt de toewijzing pas bij <c>StartGame</c>.
    /// </summary>
    public static ValidationResult RoleSelectionIsOpen(GameState state) =>
        state.Settings.RolesEnabled && state.Settings.RoleAssignment == RoleAssignmentMode.Choose
            ? ValidationResult.Success()
            : ValidationResult.Failure("Rolkeuze is niet beschikbaar voor dit spel.");

    public static ValidationResult RoleIsKnown(GameState state, string roleId) =>
        state.Map.Roles.Any(role => role.Id == roleId)
            ? ValidationResult.Success()
            : ValidationResult.Failure($"Onbekende rol '{roleId}'.");

    /// <summary>Of nog geen enkele speler deze rol al gekozen heeft (FO §8).</summary>
    public static ValidationResult RoleIsAvailable(GameState state, string roleId) =>
        state.Players.Any(player => player.RoleId == roleId)
            ? ValidationResult.Failure($"Rol '{roleId}' is al gekozen.")
            : ValidationResult.Success();

    /// <summary>Analoog aan <see cref="AllPlayersHaveChosenColor"/>, voor Kiezen-modus (FO §8).</summary>
    public static ValidationResult AllPlayersHaveChosenRole(GameState state) =>
        state.Players.All(player => player.RoleId is not null)
            ? ValidationResult.Success()
            : ValidationResult.Failure("Niet alle spelers hebben al een rol gekozen.");

    /// <summary>
    /// Validatie bij spelstart (FO §8): "aantal rollen ≥ aantal spelers". De kaartdata
    /// garandeert dit ruimschoots voor het maximum van 7, maar dit geldt per speleraantal.
    /// </summary>
    public static ValidationResult RolePoolIsLargeEnough(GameState state) =>
        state.Map.Roles.Count >= state.Players.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure("Onvoldoende rollen beschikbaar voor het aantal spelers.");

    /// <summary>Analoog aan <see cref="RolePoolIsLargeEnough"/>, voor geheime missies (FO §6.1).</summary>
    public static ValidationResult MissionPoolIsLargeEnough(GameState state) =>
        state.Map.Missions.Count >= state.Players.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure("Onvoldoende missies beschikbaar voor het aantal spelers.");
}
