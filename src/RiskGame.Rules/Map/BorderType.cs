namespace RiskGame.Rules.Map;

/// <summary>
/// Soort verbinding tussen twee gebieden. Voor aanvallen en verplaatsen gelden beide
/// als "aangrenzend"; het onderscheid bestaat zodat het SeaRoutesBlocked-effect
/// (FO §9.2) zeeroutes kan wegfilteren zonder een aparte lijst bij te houden.
/// </summary>
public enum BorderType
{
    Land,
    Sea,
}
