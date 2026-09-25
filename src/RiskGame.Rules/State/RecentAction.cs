namespace RiskGame.Rules.State;

/// <summary>
/// Eén regel in het verloop op de TV (plan-testronde-tv punt 4): een al gebeurde, openbare actie,
/// gestructureerd opgeslagen zodat de tekst via i18n loopt. Geen spelregel — de rules engine
/// leest dit nooit; het staat op <see cref="GameState"/> om dezelfde reden als
/// <see cref="GameState.TvDisplay"/>: per spel server-side vastgelegd, zodat een herladen TV
/// hetzelfde verloop terugkrijgt.
/// </summary>
/// <param name="Sequence">
/// Oplopend volgnummer, gezet door <see cref="RecentActionLog.Append"/>; blijft gelijk wanneer een
/// actie met de bovenste regel samenvoegt. Laat de TV een nieuwe regel onderscheiden van een
/// bijgewerkte.
/// </param>
/// <param name="PlayerId">De speler die de actie uitvoert; <c>null</c> bij <see cref="RecentActionKind.TerritoriesDealt"/>.</param>
/// <param name="OtherPlayerId">
/// De tegenpartij: de verdediger bij <see cref="RecentActionKind.Attack"/>/<see cref="RecentActionKind.Conquered"/>,
/// de uitgeschakelde speler bij <see cref="RecentActionKind.PlayerEliminated"/>, de dreigende
/// winnaar bij <see cref="RecentActionKind.LastChanceBroken"/>.
/// </param>
/// <param name="TerritoryId">Het doelgebied (plaatsen, claimen, aanvallen, veroveren, verplaatsen).</param>
/// <param name="FromTerritoryId">Het brongebied bij aanvallen, veroveren en verplaatsen.</param>
/// <param name="Amount">Legers: toegekend, geplaatst, verplaatst, of de waarde van een kaarteninleg.</param>
/// <param name="Total">Het legeraantal op <paramref name="TerritoryId"/> ná de actie.</param>
/// <param name="AttackerLosses">Opgetelde verliezen van de aanvaller over de hele belegering.</param>
/// <param name="DefenderLosses">Opgetelde verliezen van de verdediger over de hele belegering.</param>
public sealed record RecentAction(
    RecentActionKind Kind,
    int Sequence = 0,
    string? PlayerId = null,
    string? OtherPlayerId = null,
    string? TerritoryId = null,
    string? FromTerritoryId = null,
    int? Amount = null,
    int? Total = null,
    int? AttackerLosses = null,
    int? DefenderLosses = null);

public enum RecentActionKind
{
    /// <summary>De server heeft alle gebieden willekeurig verdeeld (startopstelling Random).</summary>
    TerritoriesDealt,
    TerritoryClaimed,
    /// <summary>Het begin van een beurt: de toegekende versterkingen. Ook de beurtgrens voor samenvoegen.</summary>
    ReinforcementsGranted,
    ArmiesPlaced,
    CardsTraded,
    CardTradeReverted,
    /// <summary>Een lopende belegering: opeenvolgende worpen op hetzelfde doel, verliezen opgeteld.</summary>
    Attack,
    /// <summary>Een belegering die het doelgebied heeft veroverd — dezelfde regel als de <see cref="Attack"/> ervoor.</summary>
    Conquered,
    Fortified,
    PlayerEliminated,
    /// <summary>Een laatste-kans-venster opent (FO §6.2); alleen zichtbaar bij "Volle ronde met onthulling".</summary>
    LastChanceOpened,
    /// <summary>Een laatste-kans-venster is doorbroken (FO §6.2); alleen zichtbaar bij "Volle ronde met onthulling".</summary>
    LastChanceBroken,
}
