namespace RiskGame.Rules.Roles;

/// <summary>
/// Zoekt het rol-herkomstland op (FO §8.1) — gedeeld tussen de Claim-guard
/// (<see cref="Validation.SetupGuards.TerritoryIsNotOwnRoleOrigin"/>) en de
/// Random-verdelingscalculator (<see cref="Territories.TerritoryAssignmentCalculator"/>),
/// zodat een toekomstige wijziging aan de rol-herkomst-regel op één plek verandert.
/// </summary>
public static class RoleOriginLookup
{
    /// <summary>
    /// <c>null</c> als de speler geen rol heeft (rollen staan uit, of de roltoewijzing
    /// heeft deze speler nooit een rol gegeven) — geen restrictie in dat geval.
    /// </summary>
    public static string? OriginTerritoryIdOf(string? roleId, IReadOnlyList<RoleDefinition> roles) =>
        roleId is null ? null : roles.First(role => role.Id == roleId).OriginTerritory;
}
