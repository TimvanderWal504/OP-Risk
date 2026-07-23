using RiskGame.Rules.Map;

namespace RiskGame.Persistence.Map;

/// <summary>Laadt een kaartvariant op basis van zijn id (TO §3.2).</summary>
public interface IMapDefinitionSource
{
    MapDefinition Load(string mapId);
}
