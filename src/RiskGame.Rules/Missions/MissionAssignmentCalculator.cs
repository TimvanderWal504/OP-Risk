using RiskGame.Rules.Abstractions;
using RiskGame.Rules.State;

namespace RiskGame.Rules.Missions;

/// <summary>
/// Lost <see cref="EliminatePlayerMission"/>-fallbacks op (FO §6.1) — zowel bij de initiële
/// toewijzing (<see cref="Assign"/>) als bij een latere, tussentijdse wissel
/// (<see cref="ResolveFallbacksAfterElimination"/>) wanneer het doelwit van iemands missie
/// door een ándere speler wordt uitgeschakeld. Eén concept, twee aanroepmomenten.
/// </summary>
public static class MissionAssignmentCalculator
{
    /// <summary>
    /// <paramref name="missionPool"/> moet, ná filtering op <see cref="MissionDefinition.MinPlayers"/>,
    /// minstens zoveel missies bevatten als <paramref name="players"/> (bewaakt door
    /// <c>MissionPoolIsLargeEnough</c> vóór de aanroep). Elke speler in <paramref name="players"/>
    /// heeft al een kleur (FO §3, afgedwongen door <c>AllPlayersHaveChosenColor</c> vóór
    /// missietoewijzing plaatsvindt). Verwerkt meteen de <see cref="EliminatePlayerMission"/>-
    /// vervanging: is het doelwit de speler zelf, of doet die kleur niet mee, dan komt de speler
    /// op een willekeurige, nog ongebruikte <see cref="ConquerContinentsMission"/> uit
    /// (<see cref="PickFallback"/>) — de projectie krijgt alleen de uiteindelijke missie-id te
    /// zien, niet de oorspronkelijke trekking.
    /// </summary>
    public static IReadOnlyDictionary<string, string> Assign(
        IReadOnlyList<Player> players, IReadOnlyList<MissionDefinition> missionPool, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(players);
        ArgumentNullException.ThrowIfNull(missionPool);
        ArgumentNullException.ThrowIfNull(random);

        var eligiblePool = missionPool.Where(mission => mission.MinPlayers <= players.Count).ToList();
        var activeColors = players.Select(player => player.ColorId).ToHashSet();
        var drawn = random.PickRandomSubset(eligiblePool, players.Count);

        // Fase 1: wie zijn getrokken missie mag houden, legt die meteen vast. Die ids liggen
        // vast vóórdat er fallback-missies uit de categorie worden gekozen — een categorielid
        // kan immers ook gewoon rechtstreeks getrokken zijn door een andere speler.
        var assignments = new Dictionary<string, string>(players.Count);
        var usedMissionIds = new HashSet<string>(StringComparer.Ordinal);
        var needsFallback = new List<Player>();

        foreach (var (player, mission) in players.Zip(drawn))
        {
            if (NeedsFallback(mission, player.ColorId!, activeColors))
            {
                needsFallback.Add(player);
                continue;
            }

            assignments[player.Id] = mission.Id;
            usedMissionIds.Add(mission.Id);
        }

        // Fase 2: fallbacks uit de categorie kiezen, elke keuze meteen als gebruikt markeren
        // zodat twee spelers nooit dezelfde fallback-missie krijgen.
        if (needsFallback.Count > 0)
        {
            var categoryPool = missionPool.OfType<ConquerContinentsMission>()
                .Where(mission => mission.MinPlayers <= players.Count)
                .ToList();

            foreach (var player in needsFallback)
            {
                var picked = PickFallback(categoryPool, usedMissionIds, random);
                usedMissionIds.Add(picked);
                assignments[player.Id] = picked;
            }
        }

        return assignments;
    }

    /// <summary>
    /// Wie moet er, ná de eliminatie van <paramref name="eliminatedColorId"/>, automatisch op
    /// een fallback-missie overstappen (FO §6.1: "wordt het doelwit door een andere speler
    /// uitgeschakeld → speler krijgt automatisch de fallback-missie")? Sluit
    /// <paramref name="eliminatedByPlayerId"/> zelf uit — schakelde de missiehouder het
    /// doelwit zélf uit, dan blijft zijn missie staan en telt hij gewoon mee bij de
    /// eerstvolgende <c>EndTurn</c>-controle (<see cref="WinConditionEvaluator"/>). Sluit ook
    /// al-uitgeschakelde houders uit: die kunnen toch niet meer winnen, dus een herwijzing
    /// voor hen zou alleen een betekenisloos event opleveren. De categorie-keuze houdt
    /// rekening met de missies die alle (niet alleen de herwezen) spelers op dit moment al
    /// hebben, zodat de nieuwe fallback nooit botst met een missie die elders al in gebruik is.
    /// </summary>
    public static IReadOnlyDictionary<string, string> ResolveFallbacksAfterElimination(
        IReadOnlyList<Player> players, IReadOnlyList<MissionDefinition> missionPool,
        string eliminatedColorId, string eliminatedByPlayerId, IRandomSource random)
    {
        ArgumentNullException.ThrowIfNull(players);
        ArgumentNullException.ThrowIfNull(missionPool);
        ArgumentException.ThrowIfNullOrWhiteSpace(eliminatedColorId);
        ArgumentException.ThrowIfNullOrWhiteSpace(eliminatedByPlayerId);
        ArgumentNullException.ThrowIfNull(random);

        var holders = players
            .Where(player => !player.IsEliminated
                && player.Id != eliminatedByPlayerId
                && player.Mission is EliminatePlayerMission eliminate
                && eliminate.TargetColor == eliminatedColorId)
            .ToList();

        if (holders.Count == 0)
        {
            return new Dictionary<string, string>();
        }

        var usedMissionIds = players
            .Select(player => player.Mission?.Id)
            .Where(id => id is not null)
            .Select(id => id!)
            .ToHashSet(StringComparer.Ordinal);
        var categoryPool = missionPool.OfType<ConquerContinentsMission>()
            .Where(mission => mission.MinPlayers <= players.Count)
            .ToList();

        var fallbacks = new Dictionary<string, string>();

        foreach (var holder in holders)
        {
            var picked = PickFallback(categoryPool, usedMissionIds, random);
            usedMissionIds.Add(picked);
            fallbacks[holder.Id] = picked;
        }

        return fallbacks;
    }

    private static bool NeedsFallback(
        MissionDefinition mission, string ownColorId, HashSet<string?> activeColors) =>
        mission is EliminatePlayerMission eliminate
            && (eliminate.TargetColor == ownColorId || !activeColors.Contains(eliminate.TargetColor));

    /// <summary>
    /// Kiest willekeurig één nog-niet-gebruikte missie uit de fallback-categorie
    /// (<see cref="ConquerContinentsMission"/>, FO §6.1) — nooit dezelfde missie tweemaal in
    /// hetzelfde spel. Een lege beschikbare-lijst is een datafout, geen speelsituatie: de
    /// parser bewaakt (<c>MapDefinitionParser.ValidateMissions</c>) dat er minstens één
    /// ConquerContinents-missie bestaat, maar niet dat er genoeg zijn voor élk denkbaar aantal
    /// gelijktijdige fallbacks bij 7 spelers — vandaar de exception i.p.v. een Result: dit hoort
    /// niet te kunnen gebeuren met de meegeleverde standaard-43-data.
    /// </summary>
    private static string PickFallback(
        IReadOnlyList<ConquerContinentsMission> categoryPool, HashSet<string> usedMissionIds, IRandomSource random)
    {
        var available = categoryPool.Where(mission => !usedMissionIds.Contains(mission.Id)).ToList();

        if (available.Count == 0)
        {
            throw new InvalidOperationException(
                "Geen ongebruikte ConquerContinents-missie meer beschikbaar als fallback (FO §6.1) — de missieset is te klein voor dit spelersaantal.");
        }

        return available[random.Next(0, available.Count)].Id;
    }
}
