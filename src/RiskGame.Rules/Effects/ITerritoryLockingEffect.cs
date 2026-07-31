namespace RiskGame.Rules.Effects;

/// <summary>
/// Capability-interface voor een effect dat een gebied deze ronde afsluit (FO §9.2,
/// <c>TerritoryLocked</c>). Het effect bepaalt zelf welke gebieden het treft; de guards
/// hoeven alleen te weten dát een gebied op slot zit.
/// </summary>
/// <remarks>
/// Eén vraag voor zowel aanvallen als verplaatsen, omdat het FO er één regel van maakt:
/// "de genoemde gebieden zijn deze ronde volledig afgesloten: niet aan te vallen, niet vanuit
/// aan te vallen, geen Verplaatsen erin of eruit" (FO §9.2). Er bestaat geen effect dat het
/// één blokkeert en het ander toestaat, en ook geen speler- of state-afhankelijke variant.
/// Zou dat er ooit komen, dan is dat eerst een FO-wijziging en pas daarna een bredere
/// signatuur hier — niet andersom.
/// </remarks>
public interface ITerritoryLockingEffect
{
    bool IsLocked(string territoryId);
}
