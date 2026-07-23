using RiskGame.Rules.Map;

namespace RiskGame.Rules.Tests;

/// <summary>
/// De aangrenzingsgraaf is het fundament onder aanvallen en verplaatsen. De
/// connectiviteitstest is tegelijk de regressietest op adjacency_validated.json die
/// TO §9 vraagt: hij faalt zodra een gebied losgekoppeld raakt.
/// </summary>
public class AdjacencyGraphTests
{
    [Fact]
    public void AlleGebieden_ZijnOnderlingBereikbaar()
    {
        var map = Standaard43Data.Load();
        var start = map.Territories[0].Id;

        var reached = new HashSet<string>(StringComparer.Ordinal) { start };
        var queue = new Queue<string>([start]);

        while (queue.Count > 0)
        {
            foreach (var neighbour in map.Adjacency.Neighbours(queue.Dequeue()))
            {
                if (reached.Add(neighbour))
                {
                    queue.Enqueue(neighbour);
                }
            }
        }

        Assert.Equal(map.Territories.Count, reached.Count);
    }

    [Fact]
    public void ElkGebied_HeeftMinstensEenGrens()
    {
        var map = Standaard43Data.Load();

        var isolated = map.Territories
            .Where(territory => map.Adjacency.Borders(territory.Id).Count == 0)
            .Select(territory => territory.Id)
            .ToList();

        Assert.Empty(isolated);
    }

    [Fact]
    public void EenGrens_WerktInBeideRichtingen()
    {
        var map = Standaard43Data.Load();

        foreach (var border in map.Borders)
        {
            Assert.True(
                map.Adjacency.IsAdjacent(border.From, border.To),
                $"{border.From} zou moeten grenzen aan {border.To}");
            Assert.True(
                map.Adjacency.IsAdjacent(border.To, border.From),
                $"{border.To} zou moeten grenzen aan {border.From}");
        }
    }

    [Theory]
    [InlineData("alaska", "kamchatka")]
    [InlineData("new-zealand", "argentina")]
    [InlineData("new-zealand", "eastern-australia")]
    public void BekendeZeeroutes_BestaanEnZijnVanTypeSea(string from, string to)
    {
        var map = Standaard43Data.Load();

        var border = map.Adjacency.Borders(from)
            .SingleOrDefault(candidate => candidate.From == to || candidate.To == to);

        Assert.NotNull(border);
        Assert.Equal(BorderType.Sea, border.Type);
    }

    [Fact]
    public void NieuwZeeland_IsGeenDoodlopendEiland()
    {
        var map = Standaard43Data.Load();

        Assert.Equal(2, map.Adjacency.Borders("new-zealand").Count);
    }

    [Fact]
    public void OnbekendGebied_HeeftGeenGrenzen_ZonderTeCrashen()
    {
        var map = Standaard43Data.Load();

        Assert.Empty(map.Adjacency.Borders("atlantis"));
        Assert.False(map.Adjacency.IsAdjacent("atlantis", "alaska"));
    }

    [Fact]
    public void HasPath_VanGebiedNaarZichzelf_IsAltijdWaar()
    {
        var map = Standaard43Data.Load();

        Assert.True(map.Adjacency.HasPath("alaska", "alaska", _ => false));
    }

    [Fact]
    public void HasPath_OverMeerdereTraversableTussenstops_IsWaar()
    {
        var map = Standaard43Data.Load();
        var owned = new HashSet<string>(StringComparer.Ordinal)
        {
            "alaska", "alberta", "ontario", "quebec",
        };

        Assert.True(map.Adjacency.HasPath("alaska", "quebec", owned.Contains));
    }

    [Fact]
    public void HasPath_ZonderTraversableTussenstop_IsOnwaar()
    {
        var map = Standaard43Data.Load();
        var owned = new HashSet<string>(StringComparer.Ordinal)
        {
            "alaska", "ontario", "quebec",
        };

        Assert.False(map.Adjacency.HasPath("alaska", "quebec", owned.Contains));
    }

    [Fact]
    public void HasPath_MetGeblokkeerdeGrens_NegeertDieRoute()
    {
        var map = Standaard43Data.Load();
        var owned = new HashSet<string>(StringComparer.Ordinal) { "alaska", "kamchatka" };

        Assert.False(map.Adjacency.HasPath(
            "alaska", "kamchatka", owned.Contains, isBorderBlocked: _ => true));
    }

    [Fact]
    public void Equals_ZelfdeGrenzenAndereVolgorde_IsGelijk()
    {
        var borders = new[]
        {
            new Border("alaska", "kamchatka", BorderType.Sea),
            new Border("alaska", "alberta", BorderType.Land),
            new Border("alberta", "ontario", BorderType.Land),
        };

        var first = new AdjacencyGraph(borders);
        var second = new AdjacencyGraph(borders.Reverse());

        Assert.Equal(first, second);
        Assert.Equal(first.GetHashCode(), second.GetHashCode());
    }

    [Fact]
    public void Equals_AndereGrens_IsOngelijk()
    {
        var first = new AdjacencyGraph([new Border("alaska", "alberta", BorderType.Land)]);
        var second = new AdjacencyGraph([new Border("alaska", "kamchatka", BorderType.Sea)]);

        Assert.NotEqual(first, second);
    }
}
