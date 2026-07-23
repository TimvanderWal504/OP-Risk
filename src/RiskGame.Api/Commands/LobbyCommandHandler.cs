using Marten;
using RiskGame.Api.Dtos;
using RiskGame.Persistence.Events;
using RiskGame.Rules.Abstractions;
using RiskGame.Rules.Missions;
using RiskGame.Rules.Results;
using RiskGame.Rules.Roles;
using RiskGame.Rules.State;
using RiskGame.Rules.Validation;

namespace RiskGame.Api.Commands;

public sealed record JoinGameResult(string PlayerId, GameStateDto State);

/// <summary>
/// Voert de TO §4-pijplijn uit voor de lobby-commando's: fase-check en regelvalidatie via
/// de rules engine, dan pas events persisteren en de nieuwe projectie teruggeven. Faalt de
/// validatie, dan wordt er niets opgeslagen (geen state-wijziging, TO §4-diagram).
/// </summary>
public sealed class LobbyCommandHandler(IDocumentStore store, IRandomSource random)
{
    public async Task<Result<CreateGameResponse>> CreateGameAsync(CreateGameRequest request)
    {
        var gameId = GameIdGenerator.NewGameId();
        var settings = GameStateDtoMapper.ToDomain(request.Settings);

        await using var session = store.LightweightSession();
        session.Events.StartStream<GameState>(gameId, new GameCreated(gameId, request.MapId, settings));
        await session.SaveChangesAsync();

        return Result<CreateGameResponse>.Success(new CreateGameResponse(gameId));
    }

    public async Task<Result<JoinGameResult>> JoinGameAsync(string gameId, string playerName)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<JoinGameResult>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = ValidationResult.Combine(
            LobbyGuards.GameIsInLobby(state),
            LobbyGuards.SlotIsAvailable(state));

        if (!validation.IsSuccess)
        {
            return Result<JoinGameResult>.Failure(validation.Errors);
        }

        var playerId = Guid.NewGuid().ToString();
        var isHost = state.Players.Count == 0;
        session.Events.Append(gameId, new PlayerJoined(gameId, playerId, playerName, isHost));
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<JoinGameResult>.Success(
            new JoinGameResult(playerId, GameStateDtoMapper.ToDto(updated!)));
    }

    public async Task<Result<GameStateDto>> ChooseColorAsync(string gameId, string playerId, string colorId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = ValidationResult.Combine(
            LobbyGuards.GameIsInLobby(state),
            Guards.PlayerExists(state, playerId),
            LobbyGuards.ColorIsKnown(state, colorId),
            LobbyGuards.ColorIsAvailable(state, colorId));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new ColorChosen(gameId, playerId, colorId));
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }

    public async Task<Result<GameStateDto>> StartGameAsync(string gameId, string playerId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validations = new List<ValidationResult>
        {
            LobbyGuards.GameIsInLobby(state),
            Guards.PlayerExists(state, playerId),
            LobbyGuards.CallerIsHost(state, playerId),
            LobbyGuards.HasMinimumPlayers(state),
            LobbyGuards.AllPlayersHaveChosenColor(state),
        };

        if (state.Settings.RolesEnabled)
        {
            validations.Add(LobbyGuards.RolePoolIsLargeEnough(state));

            if (state.Settings.RoleAssignment == RoleAssignmentMode.Choose)
            {
                validations.Add(LobbyGuards.AllPlayersHaveChosenRole(state));
            }
        }

        if (state.Settings.WinCondition == WinCondition.SecretMissions)
        {
            validations.Add(LobbyGuards.MissionPoolIsLargeEnough(state));
        }

        var validation = ValidationResult.Combine(validations.ToArray());

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        if (state.Settings.RolesEnabled && state.Settings.RoleAssignment == RoleAssignmentMode.Random)
        {
            var roleAssignments = RoleAssignmentCalculator.Assign(
                state.Players.Select(player => player.Id).ToArray(), state.Map.Roles, random);

            foreach (var (assignedPlayerId, roleId) in roleAssignments)
            {
                session.Events.Append(gameId, new RoleAssigned(gameId, assignedPlayerId, roleId));
            }
        }

        if (state.Settings.WinCondition == WinCondition.SecretMissions)
        {
            var missionAssignments = MissionAssignmentCalculator.Assign(state.Players, state.Map.Missions, random);

            foreach (var (assignedPlayerId, missionId) in missionAssignments)
            {
                session.Events.Append(gameId, new MissionAssigned(gameId, assignedPlayerId, missionId));
            }
        }

        session.Events.Append(gameId, new GameStarted(gameId));
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }

    public async Task<Result<GameStateDto>> SelectRoleAsync(string gameId, string playerId, string roleId)
    {
        await using var session = store.LightweightSession();
        var state = await session.LoadAsync<GameState>(gameId);

        if (state is null)
        {
            return Result<GameStateDto>.Failure($"Onbekend spel '{gameId}'.");
        }

        var validation = ValidationResult.Combine(
            LobbyGuards.GameIsInLobby(state),
            Guards.PlayerExists(state, playerId),
            LobbyGuards.RoleSelectionIsOpen(state),
            LobbyGuards.RoleIsKnown(state, roleId),
            LobbyGuards.RoleIsAvailable(state, roleId));

        if (!validation.IsSuccess)
        {
            return Result<GameStateDto>.Failure(validation.Errors);
        }

        session.Events.Append(gameId, new RoleAssigned(gameId, playerId, roleId));
        await session.SaveChangesAsync();

        var updated = await session.LoadAsync<GameState>(gameId);

        return Result<GameStateDto>.Success(GameStateDtoMapper.ToDto(updated!));
    }
}
