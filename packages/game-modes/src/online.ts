import { GameModesError } from "./errors.js";
import type { LobbyState, OnlinePlayerSession, Player } from "./types.js";

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

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function createRoomCode(
  length = 6,
  randomInt: (maxExclusive: number) => number = (maxExclusive) =>
    Math.floor(Math.random() * maxExclusive),
): string {
  if (!Number.isInteger(length) || length < 4 || length > 10) {
    throw new GameModesError(
      "INVALID_CONFIGURATION",
      "Room-code length must be an integer from 4 through 10.",
    );
  }

  return Array.from({ length }, () => ROOM_ALPHABET[randomInt(ROOM_ALPHABET.length)]).join("");
}
