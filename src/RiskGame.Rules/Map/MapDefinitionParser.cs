using System.Text.Json;
using RiskGame.Rules.Map.Json;
using RiskGame.Rules.Results;

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

        ValidateReferences(territories, continents, borders, errors);
        ValidateConnectivity(territories, borders, errors);

        if (errors.Count > 0)
        {
            return Result<MapDefinition>.Failure(errors);
        }

        var deck = CardDeckBuilder.Build(territories, deckRules.Symbols, deckRules.JokerCount);

        return Result<MapDefinition>.Success(new MapDefinition(
            mapId, territories, continents, colors, borders, deck, deckRules.SetRules, deckRules.Themes));
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
