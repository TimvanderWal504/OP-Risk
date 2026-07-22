namespace RiskGame.Rules.Map;

/// <summary>
/// Verbinding tussen twee gebieden. Ongericht: de graaf registreert hem in beide
/// richtingen (TO §3.3).
/// </summary>
public sealed record Border(string From, string To, BorderType Type);
