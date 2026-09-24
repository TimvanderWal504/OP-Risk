namespace RiskGame.Rules.State;

/// <summary>
/// Wat de verdediger mag kiezen in FO §5.3 stap 4 (lobby-instelling Dobbelregel, FO §10).
/// </summary>
public enum DefenseDiceRule
{
    /// <summary>
    /// Standaard. Gooit de aanvaller met 1 dobbelsteen, dan verdedigt de verdediger ook met 1 —
    /// tenzij hij een beschikbare <c>DefenseBoost</c>-rol inzet (FO §8.1). Bewuste huisregel.
    /// </summary>
    HouseRule,

    /// <summary>Officiële Risk-regel: vanaf 2 legers altijd 2 verdedigingsdobbelstenen mogelijk.</summary>
    Classic,
}
