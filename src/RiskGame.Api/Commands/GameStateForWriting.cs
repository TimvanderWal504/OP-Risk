using Marten;
using RiskGame.Rules.State;

namespace RiskGame.Api.Commands;

/// <summary>
/// Laadt de <see cref="GameState"/> voor een commando dat erop beslist en daarna appendt, met de
/// optimistische concurrency vanaf het moment van laden (FO §9.2, TO §5.2). Zonder dit ziet Marten
/// een gelijktijdige append pas als twee <c>SaveChangesAsync</c>-aanroepen elkaar overlappen: het
/// streamversienummer wordt dan pas bij het opslaan opgehaald. Een commando dat op een inmiddels
/// verouderde state besliste, slaat dan gewoon op — twee laatste attrition-keuzes die elk denken dat
/// de ander nog moet kiezen, of twee beurteindes die elk een kaart trekken.
/// </summary>
/// <remarks>
/// Hetzelfde als Marten's <c>FetchForWriting</c> voor een bestaande stream: eerst de streamversie,
/// dan het document (dat dus minstens zo nieuw is), en een lege append-actie met die versie als
/// verwachting. Elke latere <c>session.Events.Append(gameId, …)</c> in deze sessie sluit daarop aan,
/// zodat <c>SaveChangesAsync</c> een <c>EventStreamUnexpectedMaxEventIdException</c> gooit als
/// iemand anders tussendoor appendde — die vangt <see cref="ConcurrencyRetry"/> op.
///
/// Niet <c>FetchForWriting</c> zelf: voor een document zonder stream (een spel dat een test met
/// <c>session.Store</c> neerzette) maakt dat een start-actie, en dan laadt de inline projectie het
/// bestaande document niet mee. Zonder stream is er hier dus geen verwachting — in productie begint
/// elk spel met <c>GameCreated</c> en bestaat de stream altijd.
/// </remarks>
public static class GameStateForWriting
{
    public static async Task<GameState?> LoadAsync(IDocumentSession session, string gameId)
    {
        ArgumentNullException.ThrowIfNull(session);
        ArgumentException.ThrowIfNullOrWhiteSpace(gameId);

        var stream = await session.Events.FetchStreamStateAsync(gameId);
        var state = await session.LoadAsync<GameState>(gameId);

        if (stream is not null)
        {
            session.Events.Append(gameId).ExpectedVersionOnServer = stream.Version;
        }

        return state;
    }
}
