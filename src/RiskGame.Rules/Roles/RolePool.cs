using RiskGame.Rules.State;

namespace RiskGame.Rules.Roles;

/// <summary>
/// De rollen die in dít spel meedoen (FO §10): bij <see cref="DefenseDiceRule.Classic"/> vallen de
/// <see cref="DefenseBoostEffect"/>-rollen weg — niet uitgedeeld, niet kiesbaar, niet getoond. De
/// ene plek voor die filtering, zodat toewijzing, validatie en DTO niet uit de pas lopen.
/// </summary>
public static class RolePool
{
    public static IReadOnlyList<RoleDefinition> EffectiveRoles(GameState state)
    {
        ArgumentNullException.ThrowIfNull(state);

        return state.Settings.DefenseDiceRule == DefenseDiceRule.Classic
            ? state.Map.Roles.Where(role => role.Effect is not DefenseBoostEffect).ToArray()
            : state.Map.Roles;
    }
}
