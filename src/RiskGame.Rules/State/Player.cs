using RiskGame.Rules.Map;
using RiskGame.Rules.Missions;

namespace RiskGame.Rules.State;

/// <summary>
/// Eén deelnemer. Bevat alleen spelfeiten: of iemand verbonden is hoort bij de
/// transportlaag, niet bij de regels (FO §11.1).
/// </summary>
/// <param name="ColorId">Verwijst naar <see cref="PlayerColor.Id"/>; missies verwijzen
/// via die kleur-id naar spelers (FO §6.1).</param>
/// <param name="Hand">Territoriumkaarten in bezit. Alleen zichtbaar voor de speler zelf.</param>
/// <param name="RoleId">Null als rollen uitstaan (FO §8).</param>
/// <param name="Mission">Null bij winconditie Werelddominantie (FO §6).</param>
/// <param name="IsAutoPass">Door de host gemarkeerd als blijvend afwezig (FO §11.2).</param>
public sealed record Player(
    string Id,
    string Name,
    string ColorId,
    IReadOnlyList<Card> Hand,
    string? RoleId,
    IMission? Mission,
    bool IsEliminated,
    bool IsAutoPass);
