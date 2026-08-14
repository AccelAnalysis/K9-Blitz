import assert from "node:assert/strict";
import test from "node:test";
import {
  ComputerController,
  GameModesError,
  LocalPassAndPlaySession,
  OnlineRoomSessionRegistry,
  assignDog,
  assignPawn,
  authorizePlayerCommand,
  canStartGame,
  closeLobbyForPlay,
  createLobby,
  createRoomCode,
  joinPlayer,
  setPlayerReady,
  startGame,
} from "../dist/index.js";

const localConfiguration = {
  mode: "local_pass_and_play",
  minimumPlayers: 2,
  maximumPlayers: 3,
  dogAssignmentMode: "rules_defined",
  allowReconnect: false,
  rulesVersion: "physical-rules-pending",
  contentVersion: "reference-assets-pending",
  pawnIds: ["red", "blue", "green"],
};

function readyLocalLobby() {
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
  lobby = setPlayerReady(lobby, "p1", true);
  lobby = setPlayerReady(lobby, "p2", true);
  return lobby;
}

test("lobby assigns stable seats and blocks duplicate pawns", () => {
  let lobby = readyLocalLobby();
  assert.equal(lobby.players[0]?.seatNumber, 1);
  assert.equal(lobby.players[1]?.seatNumber, 2);
  assert.equal(canStartGame(lobby), true);

  lobby = joinPlayer(lobby, {
    playerId: "p3",
    displayName: "Player Three",
    controllerType: "computer",
  });

  assert.throws(
    () => assignPawn(lobby, "p3", "red"),
    (error) => error instanceof GameModesError && error.code === "PAWN_UNAVAILABLE",
  );
});

test("host can start only after configured minimum and ready checks succeed", () => {
  const lobby = readyLocalLobby();
  const starting = startGame(lobby, "p1");
  assert.equal(starting.setupState, "initializing");
  assert.equal(starting.status, "starting");

  const playing = closeLobbyForPlay(starting);
  assert.equal(playing.setupState, "playing");
  assert.equal(playing.status, "closed");
  assert.equal(playing.players.every((player) => player.status === "waiting"), true);
});

test("pass-and-play follows the authoritative next player and requests privacy handoff", () => {
  const playing = closeLobbyForPlay(startGame(readyLocalLobby(), "p1"));
  const session = new LocalPassAndPlaySession(playing, "p1", true);
  assert.equal(session.activePlayer.id, "p1");

  const handoff = session.handoffTo("p2");
  assert.deepEqual(handoff, {
    previousPlayerId: "p1",
    nextPlayerId: "p2",
    requiresPrivacyGate: true,
  });
});

test("player command authorization rejects non-active players and illegal commands", () => {
  assert.throws(
    () =>
      authorizePlayerCommand(
        { gameId: "g1", playerId: "p2", command: { type: "ROLL_DICE" } },
        { gameId: "g1", activePlayerId: "p1", legalCommandTypes: ["ROLL_DICE"] },
      ),
    (error) => error instanceof GameModesError && error.code === "NOT_YOUR_TURN",
  );

  assert.throws(
    () =>
      authorizePlayerCommand(
        { gameId: "g1", playerId: "p1", command: { type: "END_TURN" } },
        { gameId: "g1", activePlayerId: "p1", legalCommandTypes: ["ROLL_DICE"] },
      ),
    (error) => error instanceof GameModesError && error.code === "ILLEGAL_COMMAND",
  );
});

test("online reconnect preserves player identity and rotates reconnect credentials", () => {
  const onlineConfiguration = {
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
    configuration: onlineConfiguration,
  });
  lobby = joinPlayer(lobby, {
    playerId: "p2",
    displayName: "Remote Two",
    controllerType: "human_remote",
    userId: "user-2",
  });

  let tokenCounter = 0;
  const registry = new OnlineRoomSessionRegistry(lobby, {
    createToken: () => `token-${++tokenCounter}`,
  });
  const connected = registry.connect("user-2", "connection-a");
  registry.disconnect("p2");
  const reconnected = registry.reconnect({
    playerId: "p2",
    reconnectToken: connected.reconnectToken,
    connectionId: "connection-b",
  });

  assert.equal(reconnected.playerId, "p2");
  assert.equal(reconnected.userId, "user-2");
  assert.equal(reconnected.connectionId, "connection-b");
  assert.notEqual(reconnected.reconnectToken, connected.reconnectToken);
});

test("computer controller selects only from legal actions and prefers the highest score", async () => {
  const controller = new ComputerController(() => 0);

  const command = await controller.chooseAction([
    { command: { type: "OPTION_A" }, scoreHint: 1 },
    { command: { type: "OPTION_B" }, scoreHint: 5 },
    { command: { type: "OPTION_C" }, scoreHint: 3 },
  ]);

  assert.deepEqual(command, { type: "OPTION_B" });
});

test("room codes avoid ambiguous characters and support deterministic generation", () => {
  const code = createRoomCode(6, () => 0);
  assert.equal(code, "AAAAAA");
  assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
});

test("online hosts require authenticated remote identity", () => {
  const configuration = {
    ...localConfiguration,
    mode: "online_private",
    allowReconnect: true,
  };

  assert.throws(
    () =>
      createLobby({
        gameId: "missing-identity",
        roomCode: "BARK99",
        host: {
          playerId: "p1",
          displayName: "Remote One",
          controllerType: "human_remote",
        },
        configuration,
      }),
    (error) =>
      error instanceof GameModesError && error.code === "REMOTE_IDENTITY_REQUIRED",
  );
});
