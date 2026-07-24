using JasperFx.Events;
using JasperFx.Events.Projections;
using Marten;
using RiskGame.Persistence.Map;
using RiskGame.Persistence.Projections;
using RiskGame.Persistence.Serialization;
using RiskGame.Rules.State;

namespace RiskGame.Persistence.Store;

/// <summary>
/// Bouwt een <see cref="DocumentStore"/> met de <see cref="GameProjection"/> inline
/// geregistreerd (TO §10.1: inline is eenvoudiger en hier ruim voldoende). Herbruikbaar
/// door tests en later door <c>RiskGame.Api</c>.
/// </summary>
/// <remarks>
/// Streams zijn string-geïdentificeerd door <see cref="GameState.GameId"/> zelf, in
/// plaats van Martens standaard <see cref="Guid"/>-stream-id: <c>GameState</c> gebruikt
/// overal in de rules engine al een string-id, en die identiteit hoeft niet te verdubbelen
/// naar een aparte Marten-specifieke Guid.
/// </remarks>
public static class GameStoreFactory
{
    public static DocumentStore Create(string connectionString, IMapDefinitionSource mapSource) =>
        DocumentStore.For(options =>
        {
            options.Connection(connectionString);
            options.Events.StreamIdentity = StreamIdentity.AsString;
            options.Schema.For<GameState>().Identity(state => state.GameId);

            // Server-side filteren op Phase (TurnTimerBackgroundService) zonder de JSONB te
            // raken: GameState heeft een volledig handgeschreven GameStateJsonConverter
            // (RiskGame.Persistence.Serialization), waardoor Martens LINQ->SQL-vertaling de
            // JSONB-vorm van "phase" niet betrouwbaar kan matchen. Een duplicated column
            // omzeilt dat door Phase apart, doorzoekbaar op te slaan.
            options.Schema.For<GameState>()
                .Duplicate(state => state.Phase, configure: index => index.Name = "idx_gamestate_phase");
            options.Projections.Add(new GameProjection(mapSource), ProjectionLifecycle.Inline);
            options.UseSystemTextJsonForSerialization(
                configure: json =>
                {
                    json.Converters.Add(new MapDefinitionJsonConverter(mapSource));
                    json.Converters.Add(new PhaseTimerJsonConverter());
                    json.Converters.Add(new GameStateJsonConverter());
                });
        });
}
