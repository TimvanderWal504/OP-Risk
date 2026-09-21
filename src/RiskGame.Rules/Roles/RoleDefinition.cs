namespace RiskGame.Rules.Roles;

/// <summary>
/// De ingelezen, gevalideerde definitie van één rol (FO §8). Een rol werkt zolang de speler
/// zijn herkomstland (<see cref="OriginTerritory"/>) bezit. Puur data: de engine kent de vaste
/// set effect-types hieronder, de content komt uit roles.json. Rollen waarvan het herkomstland
/// niet op de geladen kaart bestaat, horen niet in de toewijzingspool van die variant.
/// </summary>
public sealed record RoleDefinition(
    string Id,
    string Name,
    string OriginTerritory,
    RoleEffect Effect,
    string Description);

/// <summary>Gemeenschappelijke basis voor alle roleffecten.</summary>
public abstract record RoleEffect;

/// <summary>+<paramref name="Amount"/> leger per beurt.</summary>
public sealed record ExtraReinforcementEffect(int Amount) : RoleEffect;

/// <summary>
/// Herwerp één eigen dobbelsteen per doelgebied per beurt, na de eigen worp maar vóórdat de
/// verdediger gooit (FO §5.3 stap 3, §8.1). Bewust zonder parameters: het aantal is een vaste
/// spelregel, geen content-instelling.
/// </summary>
public sealed record RerollEffect : RoleEffect;

/// <summary>
/// Sterkere Verplaatsen: een pad door één vijandelijk gebied heen (<paramref name="ThroughEnemy"/>),
/// of <paramref name="Moves"/> verplaatsingen in plaats van één.
/// </summary>
public sealed record FortifyUpgradeEffect(bool ThroughEnemy, int Moves) : RoleEffect;

/// <summary>+<paramref name="Amount"/> extra legers bij het inleveren van een kaartenset.</summary>
public sealed record CardTradeBonusEffect(int Amount) : RoleEffect;
