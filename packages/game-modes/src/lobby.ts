import { GameModesError } from "./errors.ts";
import type {
  GameConfiguration,
  JoinPlayerInput,
  LobbyState,
  Player,
  PlayerSeat,
} from "./types.ts";

function validateConfiguration(configuration: GameConfiguration): void {
  if (!Number.isInteger(configuration.minimumPlayers) || configuration.minimumPlayers < 1) {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "minimumPlayers must be a positive integer.",
    );
  }

  if (
    !Number.isInteger(configuration.maximumPlayers) ||
    configuration.maximumPlayers < configuration.minimumPlayers
  ) {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "maximumPlayers must be an integer greater than or equal to minimumPlayers.",
    );
  }

  if (configuration.pawnIds.length < configuration.maximumPlayers) {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "pawnIds must contain at least maximumPlayers unique pawn identifiers.",
    );
  }

  if (new Set(configuration.pawnIds).size !== configuration.pawnIds.length) {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "pawnIds must be unique.",
    );
  }

  if (!configuration.rulesVersion || !configuration.contentVersion) {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "rulesVersion and contentVersion are required.",
    );
  }
}

function validateParticipantForMode(
  configuration: GameConfiguration,
  participant: JoinPlayerInput,
  isHost: boolean,
): void {
  if (participant.controllerType === "human_remote" && !participant.userId) {
    throw new GameModesError(
      "REMOTE_IDENTITY_REQUIRED",
      "Remote human players require an authenticated userId.",
    );
  }

  if (configuration.mode === "local_pass_and_play" && participant.controllerType === "human_remote") {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "Local pass-and-play does not accept remote-human controllers.",
    );
  }

  if (configuration.mode === "online_private") {
    if (participant.controllerType === "human_local") {
      throw new GameModesError(
        "INVALID_CONFIGURATION",
        "Online private games do not accept local-human controllers.",
      );
    }

    if (isHost && participant.controllerType !== "human_remote") {
      throw new GameModesError(
        "INVALID_CONFIGURATION",
        "Online private games require a remote human host.",
      );
    }
  }
}

function initialSeats(maximumPlayers: number): PlayerSeat[] {
  return Array.from({ length: maximumPlayers }, (_, index) => ({
    seatNumber: index + 1,
    playerId: null,
  }));
}

function findPlayer(state: LobbyState, playerId: string): Player {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) {
    throw new GameModesError("PLAYER_NOT_FOUND", `Player ${playerId} is not in this lobby.`);
  }
  return player;
}

function replacePlayer(state: LobbyState, player: Player): LobbyState {
  return {
    ...state,
    players: state.players.map((candidate) =>
      candidate.id === player.id ? player : candidate,
    ),
  };
}

function assertLobbyOpen(state: LobbyState): void {
  if (state.status !== "open") {
    throw new GameModesError("LOBBY_CLOSED", "The lobby no longer accepts changes.");
  }
}

function assertHost(state: LobbyState, actorPlayerId: string): void {
  if (state.hostPlayerId !== actorPlayerId) {
    throw new GameModesError("HOST_REQUIRED", "Only the host can perform this lobby action.");
  }
}

function deriveSetupState(state: LobbyState): LobbyState["setupState"] {
  if (state.status === "starting") return "initializing";
  if (state.status === "closed") return "playing";
  if (state.players.length < state.configuration.minimumPlayers) return "waiting_for_players";
  if (state.players.some((player) => !player.pawnId || !player.dogId)) {
    return "configuring_players";
  }
  return "ready_check";
}

function withDerivedSetupState(state: LobbyState): LobbyState {
  return { ...state, setupState: deriveSetupState(state) };
}

export function createLobby(input: {
  readonly gameId: string;
  readonly roomCode?: string;
  readonly host: JoinPlayerInput;
  readonly configuration: GameConfiguration;
}): LobbyState {
  validateConfiguration(input.configuration);
  validateParticipantForMode(input.configuration, input.host, true);

  const seats = initialSeats(input.configuration.maximumPlayers);
  const host: Player = {
    id: input.host.playerId,
    displayName: input.host.displayName,
    controllerType: input.host.controllerType,
    ...(input.host.userId ? { userId: input.host.userId } : {}),
    seatNumber: 1,
    pawnId: null,
    dogId: null,
    connectionState: input.host.controllerType === "human_remote" ? "connected" : "local",
    status: "selecting",
    ready: false,
  };

  const state: LobbyState = {
    gameId: input.gameId,
    ...(input.roomCode ? { roomCode: input.roomCode } : {}),
    hostPlayerId: host.id,
    configuration: input.configuration,
    setupState: "creating",
    status: "open",
    seats: seats.map((seat) =>
      seat.seatNumber === 1 ? { ...seat, playerId: host.id } : seat,
    ),
    players: [host],
  };

  return withDerivedSetupState(state);
}

export function joinPlayer(state: LobbyState, input: JoinPlayerInput): LobbyState {
  assertLobbyOpen(state);

  if (state.players.some((player) => player.id === input.playerId)) {
    throw new GameModesError("PLAYER_ALREADY_JOINED", `Player ${input.playerId} already joined.`);
  }

  if (input.userId && state.players.some((player) => player.userId === input.userId)) {
    throw new GameModesError(
      "PLAYER_ALREADY_JOINED",
      `User ${input.userId} already occupies a player seat.`,
    );
  }

  if (state.players.length >= state.configuration.maximumPlayers) {
    throw new GameModesError("PLAYER_LIMIT_REACHED", "The lobby is full.");
  }

  validateParticipantForMode(state.configuration, input, false);

  const seat = state.seats.find((candidate) => candidate.playerId === null);
  if (!seat) {
    throw new GameModesError("PLAYER_LIMIT_REACHED", "No player seat is available.");
  }

  const player: Player = {
    id: input.playerId,
    displayName: input.displayName,
    controllerType: input.controllerType,
    ...(input.userId ? { userId: input.userId } : {}),
    seatNumber: seat.seatNumber,
    pawnId: null,
    dogId: null,
    connectionState: input.controllerType === "human_remote" ? "connected" : "local",
    status: "selecting",
    ready: false,
  };

  return withDerivedSetupState({
    ...state,
    seats: state.seats.map((candidate) =>
      candidate.seatNumber === seat.seatNumber
        ? { ...candidate, playerId: player.id }
        : candidate,
    ),
    players: [...state.players, player],
  });
}

export function removePlayer(
  state: LobbyState,
  actorPlayerId: string,
  playerId: string,
): LobbyState {
  assertLobbyOpen(state);
  assertHost(state, actorPlayerId);

  if (playerId === state.hostPlayerId) {
    throw new GameModesError("HOST_REQUIRED", "The host cannot remove themselves from the lobby.");
  }

  findPlayer(state, playerId);

  return withDerivedSetupState({
    ...state,
    players: state.players.filter((player) => player.id !== playerId),
    seats: state.seats.map((seat) =>
      seat.playerId === playerId ? { ...seat, playerId: null } : seat,
    ),
  });
}

export function assignPawn(
  state: LobbyState,
  playerId: string,
  pawnId: string,
): LobbyState {
  assertLobbyOpen(state);
  const player = findPlayer(state, playerId);

  if (!state.configuration.pawnIds.includes(pawnId)) {
    throw new GameModesError("PAWN_UNAVAILABLE", `Pawn ${pawnId} is not available in this game.`);
  }

  const owner = state.players.find(
    (candidate) => candidate.id !== playerId && candidate.pawnId === pawnId,
  );
  if (owner) {
    throw new GameModesError("PAWN_UNAVAILABLE", `Pawn ${pawnId} is already assigned.`);
  }

  return withDerivedSetupState(
    replacePlayer(state, {
      ...player,
      pawnId,
      ready: false,
      status: "selecting",
    }),
  );
}

export function assignDog(
  state: LobbyState,
  playerId: string,
  dogId: string,
): LobbyState {
  assertLobbyOpen(state);
  const player = findPlayer(state, playerId);

  if (!dogId) {
    throw new GameModesError("DOG_REQUIRED", "A dog identifier is required.");
  }

  return withDerivedSetupState(
    replacePlayer(state, {
      ...player,
      dogId,
      ready: false,
      status: "selecting",
    }),
  );
}

export function setPlayerReady(
  state: LobbyState,
  playerId: string,
  ready: boolean,
): LobbyState {
  assertLobbyOpen(state);
  const player = findPlayer(state, playerId);

  if (ready && !player.pawnId) {
    throw new GameModesError("PAWN_REQUIRED", "A player must have a pawn before becoming ready.");
  }
  if (ready && !player.dogId) {
    throw new GameModesError("DOG_REQUIRED", "A player must have a dog before becoming ready.");
  }

  return withDerivedSetupState(
    replacePlayer(state, {
      ...player,
      ready,
      status: ready ? "ready" : "selecting",
    }),
  );
}

export function canStartGame(state: LobbyState): boolean {
  return (
    state.status === "open" &&
    state.players.length >= state.configuration.minimumPlayers &&
    state.players.every((player) => player.ready)
  );
}

export function startGame(state: LobbyState, actorPlayerId: string): LobbyState {
  assertLobbyOpen(state);
  assertHost(state, actorPlayerId);

  if (state.players.length < state.configuration.minimumPlayers) {
    throw new GameModesError(
      "MINIMUM_PLAYERS_NOT_MET",
      "The minimum configured player count has not been met.",
    );
  }

  const notReady = state.players.find((player) => !player.ready);
  if (notReady) {
    throw new GameModesError(
      "PLAYER_NOT_READY",
      `${notReady.displayName} is not ready to start.`,
    );
  }

  return {
    ...state,
    setupState: "initializing",
    status: "starting",
  };
}

export function closeLobbyForPlay(state: LobbyState): LobbyState {
  if (state.status !== "starting") {
    throw new GameModesError(
      "LOBBY_CLOSED",
      "A lobby can only enter play after startGame succeeds.",
    );
  }

  return {
    ...state,
    setupState: "playing",
    status: "closed",
    players: state.players.map((player) => ({
      ...player,
      status: "waiting",
    })),
  };
}
