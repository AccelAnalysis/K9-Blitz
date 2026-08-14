import assert from "node:assert/strict";
import test from "node:test";

import {
  ComputerController,
  GameModesError,
  LocalPassAndPlaySession,
  OnlineRoomSessionRegistry,
  OnlineStateCursor,
  assignDog,
  assignPawn,
  canStartGame,
  closeLobbyForPlay,
  createLobby,
  createRoomCode,
  joinPlayer,
  preflightPlayerCommand,
  setPlayerReady,
  startGame,
} from "./index.ts";
import type { GameConfiguration, LobbyState, RevisionAwarePlayerCommand } from "./types.ts";

const localConfiguration: GameConfiguration = {
  mode: "local_pass_and_play",
  minimumPlayers: 2,
  maximumPlayers: 3,
  dogAssignmentMode: "unresolved",
  allowReconnect: false,
  rulesVersion: "unassigned",
  contentVersion: "unassigned",
  pawnIds: ["red", "blue", "green"],
};

function configuredLocalLobby(): LobbyState {
  let lobby = createLobby({
    gameId: "game-local",
    host: {
      playerId: "p1",
      displayName: "Player One",
      controllerType: "human_local",
    },
    configuration: localConfiguration,
  });

  lobby = joinPlayer(lobby, {
    playerId: "p2",
    displayName: "Player Two",
    controllerType: "human_local",
  });

  lobby = assignPawn(lobby, "p1", "red");
  lobby = assignDog(lobby, "p1", "dog-a");
  lobby = assignPawn(lobby, "p2", "blue");
  lobby = assignDog(lobby, "p2", "dog-b");
  return lobby;
}

function readyLocalLobby(): LobbyState {
  let lobby = configuredLocalLobby();
  lobby = setPlayerReady(lobby, "p1", true);
  lobby = setPlayerReady(lobby, "p2", true);
  return lobby;
}

function onlineLobby(): LobbyState {
  const configuration: GameConfiguration = {
    ...localConfiguration,
    mode: "online_private",
    allowReconnect: true,
  };

  let lobby = createLobby({
    gameId: "game-online",
    roomCode: "BARK42",
    host: {
      playerId: "p1",
      displayName: "Remote One",
      controllerType: "human_remote",
      userId: "user-1",
    },
    configuration,
  });

  lobby = joinPlayer(lobby, {
    playerId: "p2",
    displayName: "Remote Two",
    controllerType: "human_remote",
    userId: "user-2",
  });
  return lobby;
}

function command(overrides: Partial<RevisionAwarePlayerCommand> = {}): RevisionAwarePlayerCommand {
  return {
    type: "ROLL_DICE",
    commandId: "cmd-1",
    actorPlayerId: "p1",
    expectedRevision: 7,
    ...overrides,
  };
}

test("lobby assigns stable seats and rejects duplicate pawns", () => {
  let lobby = readyLocalLobby();
  assert.equal(lobby.players[0]?.seatNumber, 1);
  assert.equal(lobby.players[1]?.seatNumber, 2);
  assert.equal(canStartGame(lobby), true);

  lobby = joinPlayer(lobby, {
    playerId: "p3",
    displayName: "Computer",
    controllerType: "computer",
  });

  assert.throws(
    () => assignPawn(lobby, "p3", "red"),
    (error) => error instanceof GameModesError && error.code === "PAWN_UNAVAILABLE",
  );
});

test("lobby start enforces minimum players and readiness without choosing turn order", () => {
  let singlePlayer = createLobby({
    gameId: "single",
    host: {
      playerId: "p1",
      displayName: "Player One",
      controllerType: "human_local",
    },
    configuration: localConfiguration,
  });
  singlePlayer = assignPawn(singlePlayer, "p1", "red");
  singlePlayer = assignDog(singlePlayer, "p1", "dog-a");
  singlePlayer = setPlayerReady(singlePlayer, "p1", true);

  assert.throws(
    () => startGame(singlePlayer, "p1"),
    (error) => error instanceof GameModesError && error.code === "MINIMUM_PLAYERS_NOT_MET",
  );

  const configured = configuredLocalLobby();
  assert.throws(
    () => startGame(configured, "p1"),
    (error) => error instanceof GameModesError && error.code === "PLAYER_NOT_READY",
  );

  const starting = startGame(readyLocalLobby(), "p1");
  const playing = closeLobbyForPlay(starting);
  assert.equal(playing.status, "closed");
  assert.equal(playing.setupState, "playing");
  assert.equal(playing.players.every((player) => player.status === "waiting"), true);
});

test("pass-and-play follows the authoritative next player and can require a privacy gate", () => {
  const playing = closeLobbyForPlay(startGame(readyLocalLobby(), "p1"));
  const session = new LocalPassAndPlaySession(playing, "p2", true);
  assert.equal(session.activePlayer.id, "p2");

  assert.deepEqual(session.handoffTo("p1"), {
    previousPlayerId: "p2",
    nextPlayerId: "p1",
    requiresPrivacyGate: true,
  });
});

test("revision-aware preflight accepts valid intent and rejects stale, foreign, and illegal intent", () => {
  const turn = {
    gameId: "g1",
    revision: 7,
    activePlayerId: "p1",
    legalCommandTypes: ["ROLL_DICE"],
  } as const;

  assert.doesNotThrow(() => preflightPlayerCommand({ gameId: "g1", command: command() }, turn));

  assert.throws(
    () => preflightPlayerCommand({ gameId: "g1", command: command({ expectedRevision: 6 }) }, turn),
    (error) => error instanceof GameModesError && error.code === "STALE_STATE",
  );
  assert.throws(
    () => preflightPlayerCommand({ gameId: "g1", command: command({ actorPlayerId: "p2" }) }, turn),
    (error) => error instanceof GameModesError && error.code === "NOT_YOUR_TURN",
  );
  assert.throws(
    () => preflightPlayerCommand({ gameId: "g1", command: command({ type: "END_TURN" }) }, turn),
    (error) => error instanceof GameModesError && error.code === "ILLEGAL_COMMAND",
  );
  assert.throws(
    () => preflightPlayerCommand({ gameId: "g2", command: command() }, turn),
    (error) => error instanceof GameModesError && error.code === "GAME_ID_MISMATCH",
  );
});

test("online reconnect preserves game-player identity and rotates reconnect credentials", () => {
  const lobby = onlineLobby();
  let tokenCounter = 0;
  const registry = new OnlineRoomSessionRegistry(lobby, {
    createToken: () => `token-${++tokenCounter}`,
  });

  const connected = registry.connect("user-2", "connection-a");
  const disconnected = registry.disconnect("p2");
  assert.equal(disconnected.connectionState, "disconnected");

  const reconnected = registry.reconnect({
    playerId: "p2",
    reconnectToken: connected.reconnectToken,
    connectionId: "connection-b",
  });
  assert.equal(reconnected.playerId, "p2");
  assert.equal(reconnected.userId, "user-2");
  assert.equal(reconnected.connectionId, "connection-b");
  assert.notEqual(reconnected.reconnectToken, connected.reconnectToken);

  assert.throws(
    () => registry.reconnect({
      playerId: "p2",
      reconnectToken: connected.reconnectToken,
      connectionId: "connection-c",
    }),
    (error) => error instanceof GameModesError && error.code === "INVALID_RECONNECT_TOKEN",
  );
});

test("online lobby requires authenticated remote identities and prevents one user from occupying two seats", () => {
  const configuration: GameConfiguration = {
    ...localConfiguration,
    mode: "online_private",
    allowReconnect: true,
  };

  assert.throws(
    () => createLobby({
      gameId: "missing-auth",
      host: {
        playerId: "p1",
        displayName: "Remote One",
        controllerType: "human_remote",
      },
      configuration,
    }),
    (error) => error instanceof GameModesError && error.code === "REMOTE_IDENTITY_REQUIRED",
  );

  const lobby = onlineLobby();
  assert.throws(
    () => joinPlayer(lobby, {
      playerId: "p3",
      displayName: "Duplicate User",
      controllerType: "human_remote",
      userId: "user-2",
    }),
    (error) => error instanceof GameModesError && error.code === "PLAYER_ALREADY_JOINED",
  );
});

test("online state cursor accepts only newer full authoritative snapshots for the same game", () => {
  const cursor = new OnlineStateCursor("g1", 2);
  assert.equal(cursor.accept({ gameId: "g1", revision: 3, state: { value: "new" } }), true);
  assert.equal(cursor.revision, 3);
  assert.equal(cursor.accept({ gameId: "g1", revision: 3, state: { value: "duplicate" } }), false);
  assert.equal(cursor.accept({ gameId: "g1", revision: 1, state: { value: "stale" } }), false);
  assert.equal(cursor.accept({ gameId: "g1", revision: 9, state: { value: "full-latest" } }), true);
  assert.equal(cursor.revision, 9);

  assert.throws(
    () => cursor.accept({ gameId: "other", revision: 10, state: {} }),
    (error) => error instanceof GameModesError && error.code === "GAME_ID_MISMATCH",
  );
});

test("computer controller is deterministic and can choose only from authoritative legal actions", async () => {
  const controller = new ComputerController<RevisionAwarePlayerCommand>();
  const firstBest = command({ commandId: "best-1", type: "OPTION_B" });
  const secondBest = command({ commandId: "best-2", type: "OPTION_C" });

  const selected = await controller.chooseAction([
    { command: command({ commandId: "lower", type: "OPTION_A" }), scoreHint: 1 },
    { command: firstBest, scoreHint: 5 },
    { command: secondBest, scoreHint: 5 },
  ]);
  assert.strictEqual(selected, firstBest);

  await assert.rejects(
    () => controller.chooseAction([]),
    (error) => error instanceof GameModesError && error.code === "NO_LEGAL_ACTIONS",
  );
});

test("room codes are human-friendly and validate injected randomness", () => {
  const code = createRoomCode(6, () => 0);
  assert.equal(code, "AAAAAA");
  assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);

  assert.throws(
    () => createRoomCode(6, (maxExclusive) => maxExclusive),
    (error) => error instanceof GameModesError && error.code === "INVALID_RANDOM_SOURCE",
  );
});
