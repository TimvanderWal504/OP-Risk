using System.Text.Json;
using RiskGame.Rules.Effects;
using RiskGame.Rules.Map.Json;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Results;
using RiskGame.Rules.Roles;

namespace RiskGame.Rules.Map;

/// <summary>
/// Leest de JSON van één kaartvariant in tot een gevalideerde <see cref="MapDefinition"/>.
/// Puur: tekst in, model uit. Geen bestanden, geen paden, geen tijd — het lezen van
/// bestanden gebeurt buiten RiskGame.Rules.
/// </summary>
public static class MapDefinitionParser
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
    };

    /// <summary>
    /// Levert bij succes een nieuwe, onafhankelijke <see cref="MapDefinition"/>. Bij een
    /// datafout worden álle gevonden problemen teruggegeven, niet alleen het eerste.
    /// </summary>
    public static Result<MapDefinition> Parse(string mapId, MapDataSources sources)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(mapId);
        ArgumentNullException.ThrowIfNull(sources);

        var errors = new List<string>();

        var territoryModels = Deserialize<List<TerritoryJson>>(
            sources.TerritoriesJson, "territories.json", errors);
        var borderFile = Deserialize<BordersFileJson>(
            sources.AdjacencyJson, "adjacency_validated.json", errors);
        var continentFile = Deserialize<ContinentsFileJson>(
            sources.ContinentsJson, "continents.json", errors);
        var colorFile = Deserialize<ColorsFileJson>(
            sources.ColorsJson, "colors.json", errors);
        var cardFile = Deserialize<CardsFileJson>(
            sources.CardsJson, "cards.json", errors);
        var missionFile = Deserialize<MissionsFileJson>(
            sources.MissionsJson, "missions.json", errors);
        var eventFile = Deserialize<EventsFileJson>(
            sources.EventsJson, "events.json", errors);
        var roleFile = Deserialize<RolesFileJson>(
            sources.RolesJson, "roles.json", errors);

        // Zonder leesbare bestanden heeft verder valideren geen zin.
        if (errors.Count > 0)
        {
            return Result<MapDefinition>.Failure(errors);
        }

        var territories = ReadTerritories(territoryModels!, errors);
        var borders = ReadBorders(borderFile!.Borders, errors);
        var continents = ReadContinents(continentFile!.Continents, errors);
        var colors = ReadColors(colorFile!.Colors, errors);
        var deckRules = ReadDeckRules(cardFile!, errors);
        var missions = ReadMissions(missionFile!.Missions, errors);
        var events = ReadEvents(eventFile!.Events, errors);
        var roles = ReadRoles(roleFile!.Roles, errors);

        ValidateReferences(territories, continents, borders, errors);
        ValidateConnectivity(territories, borders, errors);
        ValidateMissions(missions, continents, colors, errors);
        ValidateEvents(events, territories, borders, errors);
        roles = FilterRolesToMap(roles, territories, errors);

        if (errors.Count > 0)
        {
            return Result<MapDefinition>.Failure(errors);
        }

        var deck = CardDeckBuilder.Build(territories, deckRules.Symbols, deckRules.JokerCount);

        return Result<MapDefinition>.Success(new MapDefinition(
            mapId, territories, continents, colors, borders, deck, deckRules.SetRules, deckRules.Themes,
            missions, events, roles));
    }

    private static T? Deserialize<T>(string json, string fileName, List<string> errors)
        where T : class
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            errors.Add($"{fileName}: bestand is leeg.");
            return null;
        }

        try
        {
            var value = JsonSerializer.Deserialize<T>(json, JsonOptions);
            if (value is null)
            {
                errors.Add($"{fileName}: bevat geen inhoud.");
            }

            return value;
        }
        catch (JsonException exception)
        {
            errors.Add($"{fileName}: ongeldige JSON ({exception.Message})");
            return null;
        }
    }

    private static List<Territory> ReadTerritories(List<TerritoryJson> models, List<string> errors)
    {
        var territories = new List<Territory>(models.Count);

        foreach (var model in models)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                errors.Add("territories.json: een gebied zonder id.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(model.Continent))
            {
                errors.Add($"territories.json: gebied '{model.Id}' heeft geen continent.");
                continue;
            }

            if (model.Centroid is not { Length: 2 })
            {
                errors.Add($"territories.json: gebied '{model.Id}' heeft geen geldig centroid [lengtegraad, breedtegraad].");
                continue;
            }

            territories.Add(new Territory(
                model.Id,
                model.Name ?? model.Id,
                model.Continent,
                new Coordinate(model.Centroid[0], model.Centroid[1])));
        }

        ReportDuplicates(territories.Select(territory => territory.Id), "territories.json", "gebied-id", errors);

        return territories;
    }

    private static List<Border> ReadBorders(List<BorderJson>? models, List<string> errors)
    {
        if (models is null)
        {
            errors.Add("adjacency_validated.json: veld 'borders' ontbreekt.");
            return [];
        }

        var borders = new List<Border>(models.Count);
        var seen = new HashSet<string>(StringComparer.Ordinal);

        foreach (var model in models)
        {
            if (string.IsNullOrWhiteSpace(model.From) || string.IsNullOrWhiteSpace(model.To))
            {
                errors.Add("adjacency_validated.json: een grens zonder 'from' of 'to'.");
                continue;
            }

            if (!TryParseBorderType(model.Type, out var borderType))
            {
                errors.Add($"adjacency_validated.json: grens '{model.From}'-'{model.To}' heeft onbekend type '{model.Type}' (verwacht 'land' of 'sea').");
                continue;
            }

            if (model.From == model.To)
            {
                errors.Add($"adjacency_validated.json: gebied '{model.From}' grenst aan zichzelf.");
                continue;
            }

            // Een grens is ongericht, dus a-b en b-a zijn dezelfde grens.
            var key = string.CompareOrdinal(model.From, model.To) < 0
                ? $"{model.From}|{model.To}"
                : $"{model.To}|{model.From}";

            if (!seen.Add(key))
            {
                errors.Add($"adjacency_validated.json: grens '{model.From}'-'{model.To}' staat meer dan één keer in de lijst.");
                continue;
            }

            borders.Add(new Border(model.From, model.To, borderType));
        }

        return borders;
    }

    private static bool TryParseBorderType(string? value, out BorderType borderType)
    {
        switch (value)
        {
            case "land":
                borderType = BorderType.Land;
                return true;
            case "sea":
                borderType = BorderType.Sea;
                return true;
            default:
                borderType = default;
                return false;
        }
    }

    private static List<Continent> ReadContinents(List<ContinentJson>? models, List<string> errors)
    {
        if (models is null)
        {
            errors.Add("continents.json: veld 'continents' ontbreekt.");
            return [];
        }

        var continents = new List<Continent>(models.Count);

        foreach (var model in models)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                errors.Add("continents.json: een continent zonder id.");
                continue;
            }

            if (model.Bonus is not { } bonus)
            {
                errors.Add($"continents.json: continent '{model.Id}' heeft geen bonus.");
                continue;
            }

            continents.Add(new Continent(model.Id, model.Name ?? model.Id, bonus));
        }

        ReportDuplicates(continents.Select(continent => continent.Id), "continents.json", "continent-id", errors);

        return continents;
    }

    private static List<PlayerColor> ReadColors(List<ColorJson>? models, List<string> errors)
    {
        if (models is null)
        {
            errors.Add("colors.json: veld 'colors' ontbreekt.");
            return [];
        }

        var colors = new List<PlayerColor>(models.Count);

        foreach (var model in models)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                errors.Add("colors.json: een kleur zonder id.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(model.Hex))
            {
                errors.Add($"colors.json: kleur '{model.Id}' heeft geen hex-waarde.");
                continue;
            }

            colors.Add(new PlayerColor(
                model.Id, model.Name ?? model.Id, model.Hex, model.Symbol ?? string.Empty));
        }

        // Missies verwijzen naar spelers via kleur-id (FO §6.1); een dubbel id is stil kapot.
        ReportDuplicates(colors.Select(color => color.Id), "colors.json", "kleur-id", errors);

        return colors;
    }

    private static DeckRules ReadDeckRules(CardsFileJson file, List<string> errors)
    {
        var symbols = file.Deck?.Symbols ?? [];
        if (symbols.Count == 0)
        {
            errors.Add("cards.json: 'deck.symbols' ontbreekt of is leeg.");
        }

        var jokerCount = file.Deck?.JokerCount ?? 0;
        if (jokerCount < 0)
        {
            errors.Add("cards.json: 'deck.jokerCount' mag niet negatief zijn.");
        }

        var setRules = file.SetRules;
        if (setRules is null)
        {
            errors.Add("cards.json: veld 'setRules' ontbreekt.");
        }

        var themes = file.Themes ?? [];

        return new DeckRules(
            symbols,
            jokerCount,
            new CardSetRules(
                setRules?.ValidSets ?? [],
                setRules?.JokerIsWild ?? false,
                setRules?.OwnedTerritoryBonus ?? 0),
            themes.ToDictionary(
                theme => theme.Key,
                theme => (IReadOnlyDictionary<string, string>)theme.Value,
                StringComparer.Ordinal));
    }

    private static void ValidateReferences(
        List<Territory> territories,
        List<Continent> continents,
        List<Border> borders,
        List<string> errors)
    {
        var territoryIds = territories.Select(territory => territory.Id).ToHashSet(StringComparer.Ordinal);
        var continentIds = continents.Select(continent => continent.Id).ToHashSet(StringComparer.Ordinal);

        foreach (var territory in territories.Where(territory => !continentIds.Contains(territory.Continent)))
        {
            errors.Add($"territories.json: gebied '{territory.Id}' verwijst naar onbekend continent '{territory.Continent}'.");
        }

        // Een continent zonder gebieden levert een onhaalbare continentbonus op.
        var gebruikteContinenten = territories.Select(territory => territory.Continent).ToHashSet(StringComparer.Ordinal);
        foreach (var continent in continents.Where(continent => !gebruikteContinenten.Contains(continent.Id)))
        {
            errors.Add($"continents.json: continent '{continent.Id}' heeft geen enkel gebied.");
        }

        foreach (var border in borders)
        {
            if (!territoryIds.Contains(border.From))
            {
                errors.Add($"adjacency_validated.json: grens verwijst naar onbekend gebied '{border.From}'.");
            }

            if (!territoryIds.Contains(border.To))
            {
                errors.Add($"adjacency_validated.json: grens verwijst naar onbekend gebied '{border.To}'.");
            }
        }
    }

    private static void ValidateConnectivity(
        List<Territory> territories,
        List<Border> borders,
        List<string> errors)
    {
        if (territories.Count == 0)
        {
            return;
        }

        var graph = new AdjacencyGraph(borders);
        var start = territories[0].Id;

        var reached = new HashSet<string>(StringComparer.Ordinal) { start };
        var queue = new Queue<string>([start]);

        while (queue.Count > 0)
        {
            foreach (var neighbour in graph.Neighbours(queue.Dequeue()))
            {
                if (reached.Add(neighbour))
                {
                    queue.Enqueue(neighbour);
                }
            }
        }

        var unreachable = territories
            .Select(territory => territory.Id)
            .Where(id => !reached.Contains(id))
            .OrderBy(id => id, StringComparer.Ordinal)
            .ToList();

        if (unreachable.Count > 0)
        {
            errors.Add($"adjacency_validated.json: niet alle gebieden zijn bereikbaar vanaf '{start}'; losgekoppeld: {string.Join(", ", unreachable)}.");
        }
    }

    private static List<MissionDefinition> ReadMissions(List<MissionJson>? models, List<string> errors)
    {
        if (models is null)
        {
            errors.Add("missions.json: veld 'missions' ontbreekt.");
            return [];
        }

        var missions = new List<MissionDefinition>(models.Count);

        foreach (var model in models)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                errors.Add("missions.json: een missie zonder id.");
                continue;
            }

            var name = model.Name ?? model.Id;
            var description = model.Description ?? string.Empty;
            var requiresOwnTurn = model.RequiresOwnTurn ?? false;
            var p = model.Params;

            switch (model.Type)
            {
                case "ConquerContinents":
                    if (p?.Continents is not { Count: > 0 } continents)
                    {
                        errors.Add($"missions.json: missie '{model.Id}' (ConquerContinents) heeft geen 'continents'.");
                        continue;
                    }

                    missions.Add(new ConquerContinentsMission(
                        model.Id, name, description, requiresOwnTurn, continents, p.ExtraAnyContinent ?? false));
                    break;

                case "TerritoryCount":
                    if (p?.Count is not { } territoryCount || territoryCount <= 0)
                    {
                        errors.Add($"missions.json: missie '{model.Id}' (TerritoryCount) heeft geen positieve 'count'.");
                        continue;
                    }

                    missions.Add(new TerritoryCountMission(
                        model.Id, name, description, requiresOwnTurn, territoryCount));
                    break;

                case "TerritoryCountMinArmies":
                    if (p?.Count is not { } countMin || countMin <= 0)
                    {
                        errors.Add($"missions.json: missie '{model.Id}' (TerritoryCountMinArmies) heeft geen positieve 'count'.");
                        continue;
                    }

                    if (p.MinArmies is not { } minArmies || minArmies < 1)
                    {
                        errors.Add($"missions.json: missie '{model.Id}' (TerritoryCountMinArmies) heeft geen geldige 'minArmies' (minimaal 1).");
                        continue;
                    }

                    missions.Add(new TerritoryCountMinArmiesMission(
                        model.Id, name, description, requiresOwnTurn, countMin, minArmies));
                    break;

                case "EliminatePlayer":
                    if (string.IsNullOrWhiteSpace(p?.TargetColor))
                    {
                        errors.Add($"missions.json: missie '{model.Id}' (EliminatePlayer) heeft geen 'targetColor'.");
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(model.FallbackMissionId))
                    {
                        errors.Add($"missions.json: EliminatePlayer-missie '{model.Id}' heeft geen 'fallbackMissionId'.");
                        continue;
                    }

                    missions.Add(new EliminatePlayerMission(
                        model.Id, name, description, requiresOwnTurn, p.TargetColor, model.FallbackMissionId));
                    break;

                default:
                    errors.Add($"missions.json: missie '{model.Id}' heeft onbekend type '{model.Type}'.");
                    break;
            }
        }

        ReportDuplicates(missions.Select(mission => mission.Id), "missions.json", "missie-id", errors);

        return missions;
    }

    private static void ValidateMissions(
        List<MissionDefinition> missions,
        List<Continent> continents,
        List<PlayerColor> colors,
        List<string> errors)
    {
        var continentIds = continents.Select(continent => continent.Id).ToHashSet(StringComparer.Ordinal);
        var colorIds = colors.Select(color => color.Id).ToHashSet(StringComparer.Ordinal);
        var missionsById = missions
            .GroupBy(mission => mission.Id, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (var mission in missions)
        {
            switch (mission)
            {
                case ConquerContinentsMission conquer:
                    foreach (var continent in conquer.Continents.Where(id => !continentIds.Contains(id)))
                    {
                        errors.Add($"missions.json: missie '{conquer.Id}' verwijst naar onbekend continent '{continent}'.");
                    }

                    break;

                case EliminatePlayerMission eliminate:
                    if (!colorIds.Contains(eliminate.TargetColor))
                    {
                        errors.Add($"missions.json: missie '{eliminate.Id}' verwijst naar onbekende kleur '{eliminate.TargetColor}'.");
                    }

                    if (!missionsById.TryGetValue(eliminate.FallbackMissionId, out var fallback))
                    {
                        errors.Add($"missions.json: missie '{eliminate.Id}' verwijst naar onbekende fallbackMissionId '{eliminate.FallbackMissionId}'.");
                    }
                    else if (fallback is EliminatePlayerMission)
                    {
                        errors.Add($"missions.json: fallbackMissionId '{eliminate.FallbackMissionId}' van missie '{eliminate.Id}' mag zelf geen EliminatePlayer-missie zijn.");
                    }

                    break;
            }
        }

        // Dekkend voor alle kleuren (FO §6.1): elke speelkleur moet als eliminate-doelwit
        // bestaan, zodat bij 7 spelers elke tegenstander doelwit kan zijn.
        var targetedColors = missions
            .OfType<EliminatePlayerMission>()
            .Select(mission => mission.TargetColor)
            .ToHashSet(StringComparer.Ordinal);

        foreach (var color in colors.Where(color => !targetedColors.Contains(color.Id)))
        {
            errors.Add($"missions.json: geen EliminatePlayer-missie voor kleur '{color.Id}'; de missieset is niet dekkend (FO §6.1).");
        }
    }

    private static List<EventDefinition> ReadEvents(List<EventJson>? models, List<string> errors)
    {
        if (models is null)
        {
            errors.Add("events.json: veld 'events' ontbreekt.");
            return [];
        }

        var events = new List<EventDefinition>(models.Count);

        foreach (var model in models)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                errors.Add("events.json: een gebeurtenis zonder id.");
                continue;
            }

            if (!TryParseDuration(model.Duration, out var duration))
            {
                errors.Add($"events.json: gebeurtenis '{model.Id}' heeft onbekende duration '{model.Duration}' (verwacht 'instant' of 'oneRound').");
                continue;
            }

            if (model.Effect is null)
            {
                errors.Add($"events.json: gebeurtenis '{model.Id}' heeft geen effect.");
                continue;
            }

            var effect = ReadEventEffect(model.Id, duration, model.Effect, errors);
            if (effect is null)
            {
                continue;
            }

            events.Add(new EventDefinition(
                model.Id, model.Name ?? model.Id, model.Description ?? string.Empty, effect));
        }

        ReportDuplicates(events.Select(gebeurtenis => gebeurtenis.Id), "events.json", "gebeurtenis-id", errors);

        return events;
    }

    private static IEffect? ReadEventEffect(
        string eventId,
        EffectDuration duration,
        EventEffectJson model,
        List<string> errors)
    {
        var p = model.Params;

        switch (model.Type)
        {
            case "ContinentOwnerBonus":
                if (p?.Amount is not { } continentBonus || continentBonus <= 0)
                {
                    errors.Add($"events.json: gebeurtenis '{eventId}' (ContinentOwnerBonus) heeft geen positieve 'amount'.");
                    return null;
                }

                return new ContinentOwnerBonusEffect(eventId, duration, continentBonus);

            case "FreeReinforcement":
                if (p?.Amount is not { } reinforcement || reinforcement <= 0)
                {
                    errors.Add($"events.json: gebeurtenis '{eventId}' (FreeReinforcement) heeft geen positieve 'amount'.");
                    return null;
                }

                return new FreeReinforcementEffect(eventId, duration, reinforcement);

            case "ArmyAttrition":
                if (p?.Amount is not { } attrition || attrition <= 0)
                {
                    errors.Add($"events.json: gebeurtenis '{eventId}' (ArmyAttrition) heeft geen positieve 'amount'.");
                    return null;
                }

                if (duration != EffectDuration.Instant)
                {
                    errors.Add($"events.json: gebeurtenis '{eventId}' (ArmyAttrition) moet duration 'instant' hebben.");
                    return null;
                }

                return new ArmyAttritionEffect(eventId, duration, attrition);

            case "TerritoryLocked":
                if (p?.TerritoryIds is not { Count: > 0 } territoryIds)
                {
                    errors.Add($"events.json: gebeurtenis '{eventId}' (TerritoryLocked) heeft geen 'territoryIds'.");
                    return null;
                }

                if (duration != EffectDuration.OneRound)
                {
                    errors.Add($"events.json: gebeurtenis '{eventId}' (TerritoryLocked) moet duration 'oneRound' hebben.");
                    return null;
                }

                return new TerritoryLockedEffect(eventId, duration, territoryIds);

            case "SeaRoutesBlocked":
                // Zonder routes geldt het effect voor álle zeeverbindingen (FO §9.2).
                if (p?.Routes is not { Count: > 0 } routeModels)
                {
                    return new SeaRoutesBlockedEffect(eventId, duration, null);
                }

                var routes = new List<SeaRoute>(routeModels.Count);
                foreach (var route in routeModels)
                {
                    if (string.IsNullOrWhiteSpace(route.From) || string.IsNullOrWhiteSpace(route.To))
                    {
                        errors.Add($"events.json: gebeurtenis '{eventId}' (SeaRoutesBlocked) heeft een route zonder 'from' of 'to'.");
                        return null;
                    }

                    routes.Add(new SeaRoute(route.From, route.To));
                }

                return new SeaRoutesBlockedEffect(eventId, duration, routes);

            default:
                errors.Add($"events.json: gebeurtenis '{eventId}' heeft onbekend effect-type '{model.Type}'.");
                return null;
        }
    }

    private static void ValidateEvents(
        List<EventDefinition> events,
        List<Territory> territories,
        List<Border> borders,
        List<string> errors)
    {
        var territoryIds = territories.Select(territory => territory.Id).ToHashSet(StringComparer.Ordinal);
        var seaRoutes = borders
            .Where(border => border.Type == BorderType.Sea)
            .Select(border => RouteKey(border.From, border.To))
            .ToHashSet(StringComparer.Ordinal);

        foreach (var gebeurtenis in events)
        {
            switch (gebeurtenis.Effect)
            {
                case TerritoryLockedEffect locked:
                    foreach (var id in locked.TerritoryIds.Where(id => !territoryIds.Contains(id)))
                    {
                        errors.Add($"events.json: gebeurtenis '{gebeurtenis.Id}' vergrendelt onbekend gebied '{id}'.");
                    }

                    break;

                case SeaRoutesBlockedEffect { Routes: { } routes }:
                    foreach (var route in routes.Where(route => !seaRoutes.Contains(RouteKey(route.From, route.To))))
                    {
                        errors.Add($"events.json: gebeurtenis '{gebeurtenis.Id}' blokkeert route '{route.From}'-'{route.To}', die geen zeeverbinding is.");
                    }

                    break;
            }
        }
    }

    private static List<RoleDefinition> ReadRoles(List<RoleJson>? models, List<string> errors)
    {
        if (models is null)
        {
            errors.Add("roles.json: veld 'roles' ontbreekt.");
            return [];
        }

        var roles = new List<RoleDefinition>(models.Count);

        foreach (var model in models)
        {
            if (string.IsNullOrWhiteSpace(model.Id))
            {
                errors.Add("roles.json: een rol zonder id.");
                continue;
            }

            if (string.IsNullOrWhiteSpace(model.OriginTerritory))
            {
                errors.Add($"roles.json: rol '{model.Id}' heeft geen 'originTerritory'.");
                continue;
            }

            if (model.Effect is null)
            {
                errors.Add($"roles.json: rol '{model.Id}' heeft geen effect.");
                continue;
            }

            var effect = ReadRoleEffect(model.Id, model.Effect, errors);
            if (effect is null)
            {
                continue;
            }

            roles.Add(new RoleDefinition(
                model.Id, model.Name ?? model.Id, model.OriginTerritory, effect, model.Description ?? string.Empty));
        }

        ReportDuplicates(roles.Select(role => role.Id), "roles.json", "rol-id", errors);

        return roles;
    }

    private static RoleEffect? ReadRoleEffect(string roleId, RoleEffectJson model, List<string> errors)
    {
        var p = model.Params;

        switch (model.Type)
        {
            case "ExtraReinforcement":
                if (p?.Amount is not { } extra || extra <= 0)
                {
                    errors.Add($"roles.json: rol '{roleId}' (ExtraReinforcement) heeft geen positieve 'amount'.");
                    return null;
                }

                return new ExtraReinforcementEffect(extra);

            case "Reroll":
                if (p?.PerTurn is not { } perTurn || perTurn <= 0)
                {
                    errors.Add($"roles.json: rol '{roleId}' (Reroll) heeft geen positieve 'perTurn'.");
                    return null;
                }

                return new RerollEffect(perTurn);

            case "CardTradeBonus":
                if (p?.Amount is not { } tradeBonus || tradeBonus <= 0)
                {
                    errors.Add($"roles.json: rol '{roleId}' (CardTradeBonus) heeft geen positieve 'amount'.");
                    return null;
                }

                return new CardTradeBonusEffect(tradeBonus);

            case "FortifyUpgrade":
                var throughEnemy = p?.ThroughEnemy ?? false;
                var moves = p?.Moves ?? 0;
                if (!throughEnemy && moves < 2)
                {
                    errors.Add($"roles.json: rol '{roleId}' (FortifyUpgrade) moet 'throughEnemy' of 'moves' (minimaal 2) hebben.");
                    return null;
                }

                return new FortifyUpgradeEffect(throughEnemy, moves);

            default:
                errors.Add($"roles.json: rol '{roleId}' heeft onbekend effect-type '{model.Type}'.");
                return null;
        }
    }

    private static List<RoleDefinition> FilterRolesToMap(
        List<RoleDefinition> roles,
        List<Territory> territories,
        List<string> errors)
    {
        // Rollen waarvan het herkomstland niet op deze variant bestaat, horen niet in de
        // toewijzingspool (FO §8, roles.json): stil eruit filteren, geen datafout.
        var territoryIds = territories.Select(territory => territory.Id).ToHashSet(StringComparer.Ordinal);
        var available = roles
            .Where(role => territoryIds.Contains(role.OriginTerritory))
            .ToList();

        // Twee rollen op hetzelfde herkomstland is wél een fout (FO §8: geen dubbele herkomstlanden).
        ReportDuplicates(available.Select(role => role.OriginTerritory), "roles.json", "herkomstland", errors);

        return available;
    }

    private static string RouteKey(string from, string to) =>
        string.CompareOrdinal(from, to) < 0 ? $"{from}|{to}" : $"{to}|{from}";

    private static bool TryParseDuration(string? value, out EffectDuration duration)
    {
        switch (value)
        {
            case "instant":
                duration = EffectDuration.Instant;
                return true;
            case "oneRound":
                duration = EffectDuration.OneRound;
                return true;
            default:
                duration = default;
                return false;
        }
    }

    private static void ReportDuplicates(
        IEnumerable<string> ids,
        string fileName,
        string label,
        List<string> errors)
    {
        var duplicates = ids
            .GroupBy(id => id, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .OrderBy(id => id, StringComparer.Ordinal);

        foreach (var duplicate in duplicates)
        {
            errors.Add($"{fileName}: {label} '{duplicate}' komt meer dan één keer voor.");
        }
    }

    private sealed record DeckRules(
        IReadOnlyList<string> Symbols,
        int JokerCount,
        CardSetRules SetRules,
        IReadOnlyDictionary<string, IReadOnlyDictionary<string, string>> Themes);
}
