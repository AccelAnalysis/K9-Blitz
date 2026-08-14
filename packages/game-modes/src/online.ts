import { GameModesError } from "./errors.ts";
import type {
  AuthoritativeSnapshot,
  LobbyState,
  OnlinePlayerSession,
  Player,
} from "./types.ts";

export interface TokenSource {
  createToken(): string;
}

const secureTokenSource: TokenSource = {
  createToken: () => {
    const bytes = new Uint8Array(32);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  },
};

function playerForUser(lobby: LobbyState, userId: string): Player {
  const player = lobby.players.find((candidate) => candidate.userId === userId);
  if (!player) {
    throw new GameModesError("PLAYER_NOT_FOUND", `No lobby player is bound to user ${userId}.`);
  }
  return player;
}

export class OnlineRoomSessionRegistry {
  readonly #sessions = new Map<string, OnlinePlayerSession>();
  private readonly lobby: LobbyState;
  private readonly tokenSource: TokenSource;

  constructor(lobby: LobbyState, tokenSource: TokenSource = secureTokenSource) {
    if (lobby.configuration.mode !== "online_private") {
      throw new GameModesError(
        "INVALID_CONFIGURATION",
        "OnlineRoomSessionRegistry requires online_private mode.",
      );
    }
    this.lobby = lobby;
    this.tokenSource = tokenSource;
  }

  connect(userId: string, connectionId: string): OnlinePlayerSession {
    const player = playerForUser(this.lobby, userId);
    const session: OnlinePlayerSession = {
      playerId: player.id,
      userId,
      connectionId,
      connectionState: "connected",
      reconnectToken: this.tokenSource.createToken(),
    };
    this.#sessions.set(player.id, session);
    return session;
  }

  disconnect(playerId: string): OnlinePlayerSession {
    const session = this.#sessions.get(playerId);
    if (!session) {
      throw new GameModesError("SESSION_NOT_FOUND", `No online session exists for ${playerId}.`);
    }

    const disconnected: OnlinePlayerSession = {
      ...session,
      connectionState: "disconnected",
    };
    this.#sessions.set(playerId, disconnected);
    return disconnected;
  }

  reconnect(input: {
    readonly playerId: string;
    readonly reconnectToken: string;
    readonly connectionId: string;
  }): OnlinePlayerSession {
    if (!this.lobby.configuration.allowReconnect) {
      throw new GameModesError("RECONNECT_DISABLED", "Reconnect is disabled for this game.");
    }

    const session = this.#sessions.get(input.playerId);
    if (!session) {
      throw new GameModesError("SESSION_NOT_FOUND", `No online session exists for ${input.playerId}.`);
    }
    if (session.reconnectToken !== input.reconnectToken) {
      throw new GameModesError("INVALID_RECONNECT_TOKEN", "The reconnect token is invalid.");
    }

    const reconnected: OnlinePlayerSession = {
      ...session,
      connectionId: input.connectionId,
      connectionState: "connected",
      reconnectToken: this.tokenSource.createToken(),
    };
    this.#sessions.set(input.playerId, reconnected);
    return reconnected;
  }

  get(playerId: string): OnlinePlayerSession | undefined {
    return this.#sessions.get(playerId);
  }
}

/**
 * Tracks the newest full authoritative snapshot a client has accepted.
 * Skipped revisions are valid because these are full snapshots, not event deltas.
 */
export class OnlineStateCursor {
  readonly #gameId: string;
  #revision: number;

  constructor(gameId: string, initialRevision = -1) {
    this.#gameId = gameId;
    this.#revision = initialRevision;
  }

  get revision(): number {
    return this.#revision;
  }

  accept<TState>(snapshot: AuthoritativeSnapshot<TState>): boolean {
    if (snapshot.gameId !== this.#gameId) {
      throw new GameModesError("GAME_ID_MISMATCH", "The snapshot belongs to a different game.");
    }

    if (snapshot.revision <= this.#revision) return false;
    this.#revision = snapshot.revision;
    return true;
  }
}

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function secureRandomIndex(maxExclusive: number): number {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return (value[0] ?? 0) % maxExclusive;
}

export function createRoomCode(
  length = 6,
  randomIndex: (maxExclusive: number) => number = secureRandomIndex,
): string {
  if (!Number.isInteger(length) || length < 4 || length > 10) {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "Room-code length must be an integer from 4 through 10.",
    );
  }

  return Array.from({ length }, () => {
    const index = randomIndex(ROOM_ALPHABET.length);
    if (!Number.isInteger(index) || index < 0 || index >= ROOM_ALPHABET.length) {
      throw new GameModesError(
        "INVALID_RANDOM_SOURCE",
        `Room-code source returned out-of-range index ${index}.`,
      );
    }
    return ROOM_ALPHABET[index];
  }).join("");
}
