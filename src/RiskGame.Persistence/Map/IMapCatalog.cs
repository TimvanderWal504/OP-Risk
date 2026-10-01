namespace RiskGame.Persistence.Map;

/// <summary>De bekende kaartvarianten (<see cref="MapCatalog"/>).</summary>
public interface IMapCatalog
{
    /// <summary>Alle varianten, gesorteerd op <c>mapId</c>.</summary>
    IReadOnlyList<MapVariant> Variants { get; }

    /// <summary>Of <paramref name="mapId"/> exact een bekende variant is.</summary>
    bool Contains(string mapId);
}
