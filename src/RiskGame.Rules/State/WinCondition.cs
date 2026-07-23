namespace RiskGame.Rules.State;

/// <summary>Hoe het spel gewonnen wordt; instelbaar in de lobby (FO §6, §10).</summary>
public enum WinCondition
{
    /// <summary>Verover alle gebieden.</summary>
    WorldDomination,

    /// <summary>
    /// Iedere speler krijgt een geheime missie. Werelddominantie blijft daarnaast
    /// altijd gelden als impliciete winconditie (FO §6).
    /// </summary>
    SecretMissions,
}
