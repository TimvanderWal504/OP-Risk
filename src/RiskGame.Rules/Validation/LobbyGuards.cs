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
            : ValidationResult.Failure("lobby.notHost", new Dictionary<string, string> { ["playerId"] = playerId });
    }

    /// <summary>
    /// Of <paramref name="targetPlayerId"/> verwijderd mag worden: moet bestaan en mag
    /// geen host zijn — de host verwijdert zichzelf nooit (er is geen ander mechanisme
    /// om het hostschap over te dragen).
    /// </summary>
    public static ValidationResult TargetIsRemovable(GameState state, string targetPlayerId)
    {
        var exists = Guards.PlayerExists(state, targetPlayerId);

        if (!exists.IsSuccess)
        {
            return exists;
        }

        return state.Player(targetPlayerId).IsHost
            ? ValidationResult.Failure(
                "lobby.cannotRemoveHost", new Dictionary<string, string> { ["playerId"] = targetPlayerId })
            : ValidationResult.Success();
    }

    public static ValidationResult HasMinimumPlayers(GameState state) =>
        state.Players.Count >= MinimumPlayers
            ? ValidationResult.Success()
            : ValidationResult.Failure(
                "lobby.minimumPlayers", new Dictionary<string, string> { ["minimum"] = MinimumPlayers.ToString() });

    /// <summary>
    /// Of iedereen al een kleur heeft gekozen (FO §3: kleur kiezen gebeurt vóór het
    /// wachten in de lobby, dus dit hoort ook bij <c>StartGame</c>).
    /// </summary>
    public static ValidationResult AllPlayersHaveChosenColor(GameState state) =>
        state.Players.All(player => player.ColorId is not null)
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.notAllColorsChosen");

    public static ValidationResult ColorIsKnown(GameState state, string colorId) =>
        state.Map.Colors.Any(color => color.Id == colorId)
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.unknownColor", new Dictionary<string, string> { ["colorId"] = colorId });

    /// <summary>Of nog geen enkele speler deze kleur al gekozen heeft (FO §2.2).</summary>
    public static ValidationResult ColorIsAvailable(GameState state, string colorId) =>
        state.Players.Any(player => player.ColorId == colorId)
            ? ValidationResult.Failure("lobby.colorTaken", new Dictionary<string, string> { ["colorId"] = colorId })
            : ValidationResult.Success();

    /// <summary>
    /// Of er nog een kleur over is om aan een nieuwe speler te geven — het aantal
    /// spelerskleuren van de kaartvariant is de harde grens aan het aantal deelnemers.
    /// </summary>
    public static ValidationResult SlotIsAvailable(GameState state) =>
        state.Players.Count < state.Map.Colors.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.gameFull");

    /// <summary>
    /// Rolkeuze (FO §8) bestaat alleen als rollen aanstaan én de lobby-instelling op
    /// <see cref="RoleAssignmentMode.Choose"/> staat — bij <see cref="RoleAssignmentMode.Random"/>
    /// gebeurt de toewijzing pas bij <c>StartGame</c>.
    /// </summary>
    public static ValidationResult RoleSelectionIsOpen(GameState state) =>
        state.Settings.RolesEnabled && state.Settings.RoleAssignment == RoleAssignmentMode.Choose
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.roleSelectionClosed");

    public static ValidationResult RoleIsKnown(GameState state, string roleId) =>
        state.Map.Roles.Any(role => role.Id == roleId)
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.unknownRole", new Dictionary<string, string> { ["roleId"] = roleId });

    /// <summary>Of nog geen enkele speler deze rol al gekozen heeft (FO §8).</summary>
    public static ValidationResult RoleIsAvailable(GameState state, string roleId) =>
        state.Players.Any(player => player.RoleId == roleId)
            ? ValidationResult.Failure("lobby.roleTaken", new Dictionary<string, string> { ["roleId"] = roleId })
            : ValidationResult.Success();

    /// <summary>Analoog aan <see cref="AllPlayersHaveChosenColor"/>, voor Kiezen-modus (FO §8).</summary>
    public static ValidationResult AllPlayersHaveChosenRole(GameState state) =>
        state.Players.All(player => player.RoleId is not null)
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.notAllRolesChosen");

    /// <summary>
    /// Validatie bij spelstart (FO §8): "aantal rollen ≥ aantal spelers". De kaartdata
    /// garandeert dit ruimschoots voor het maximum van 7, maar dit geldt per speleraantal.
    /// </summary>
    public static ValidationResult RolePoolIsLargeEnough(GameState state) =>
        state.Map.Roles.Count >= state.Players.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.insufficientRoles");

    /// <summary>Analoog aan <see cref="RolePoolIsLargeEnough"/>, voor geheime missies (FO §6.1).</summary>
    public static ValidationResult MissionPoolIsLargeEnough(GameState state) =>
        state.Map.Missions.Count >= state.Players.Count
            ? ValidationResult.Success()
            : ValidationResult.Failure("lobby.insufficientMissions");
}
