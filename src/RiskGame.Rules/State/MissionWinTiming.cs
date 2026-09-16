namespace RiskGame.Rules.State;

/// <summary>
/// Wanneer een vervulde bezit-missie (<see cref="Missions.IMission.RequiresLastChance"/> =
/// <c>true</c>) daadwerkelijk wint; instelbaar in de lobby (FO §6.2, §10), alleen relevant bij
/// <see cref="WinCondition.SecretMissions"/>. Missies met <c>RequiresLastChance = false</c>
/// (onomkeerbaar, zoals <c>EliminatePlayer</c>) en werelddominantie zijn hier nooit aan
/// onderhevig — die blijven in elke stand van deze instelling direct beslissend.
/// </summary>
public enum MissionWinTiming
{
    /// <summary>Standaard: vervul je de missie, dan eindigt het spel meteen.</summary>
    EndOfTurn,

    /// <summary>
    /// Elke andere, nog niet uitgeschakelde speler krijgt eerst nog exact één beurt
    /// ("laatste kans") voordat de overwinning definitief is — geen aankondiging.
    /// </summary>
    StartOfNextTurn,

    /// <summary>
    /// Mechanisch gelijk aan <see cref="StartOfNextTurn"/>, met één verschil: zodra het
    /// venster opent, is zichtbaar wie mogelijk gaat winnen (niet de missie-inhoud).
    /// </summary>
    FullRoundRevealed,
}
