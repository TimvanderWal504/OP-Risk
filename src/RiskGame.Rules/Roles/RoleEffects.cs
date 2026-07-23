using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Rules.Roles;

/// <summary>
/// De ene plek waar "heeft deze speler een actief roleffect van dit type" wordt
/// bepaald (FO §8.1): rollen staan uit, of de speler heeft geen rol, of het effect is
/// van een ander type, of het herkomstland is niet (meer) in bezit — in elk van die
/// gevallen is er geen actief effect.
/// </summary>
public static class RoleEffects
{
    public static TEffect? Active<TEffect>(GameState state, string playerId)
        where TEffect : RoleEffect
    {
        ArgumentNullException.ThrowIfNull(state);
        ArgumentException.ThrowIfNullOrWhiteSpace(playerId);

        if (!state.Settings.RolesEnabled)
        {
            return null;
        }

        var player = state.Player(playerId);

        if (player.RoleId is null)
        {
            return null;
        }

        var role = state.Map.Roles.FirstOrDefault(role => role.Id == player.RoleId);

        if (role is not { Effect: TEffect effect })
        {
            return null;
        }

        return Guards.OwnsTerritory(state, playerId, role.OriginTerritory).IsSuccess
            ? effect
            : null;
    }
}
