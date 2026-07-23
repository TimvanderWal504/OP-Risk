namespace RiskGame.Rules.State;

/// <summary>
/// Hoe rollen worden toegewezen als <see cref="GameSettings.RolesEnabled"/> aan staat
/// (FO §8/§10). Betekenisloos zolang rollen uitstaan.
/// </summary>
public enum RoleAssignmentMode
{
    /// <summary>Elke speler krijgt bij spelstart random een rol toegewezen. Standaard.</summary>
    Random,

    /// <summary>Spelers kiezen hun rol tijdens het joinen, direct na kleurkeuze.</summary>
    Choose,
}
