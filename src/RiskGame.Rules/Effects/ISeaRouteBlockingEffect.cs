namespace RiskGame.Rules.Effects;

/// <summary>
/// Capability-interface voor een effect dat zeeroutes blokkeert (FO §9.2,
/// <c>SeaRoutesBlocked</c>). Een concreet effect bepaalt zelf, op basis van zijn eigen
/// parameters (volledige blokkade of een specifieke <c>routes</c>-lijst), welke grenzen
/// dat treft; de rules engine hoeft alleen te weten dát een grens geblokkeerd is.
/// </summary>
public interface ISeaRouteBlockingEffect
{
    bool IsRouteBlocked(Map.Border border);
}
