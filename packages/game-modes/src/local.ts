import { GameModesError } from "./errors.js";
import type { LobbyState, Player } from "./types.js";

export interface LocalTurnHandoff {
  readonly previousPlayerId: string;
  readonly nextPlayerId: string;
  readonly requiresPrivacyGate: boolean;
}

export class LocalPassAndPlaySession {
  readonly #players: readonly Player[];
  #activePlayerId: string;
  private readonly privateInformationExists: boolean;

  constructor(
    lobby: LobbyState,
    initialActivePlayerId: string,
    privateInformationExists: boolean,
  ) {
    if (lobby.configuration.mode !== "local_pass_and_play") {
      throw new GameModesError(
        "INVALID_CONFIGURATION",
        "LocalPassAndPlaySession requires local_pass_and_play mode.",
      );
    }
    if (lobby.status !== "closed") {
      throw new GameModesError(
        "LOBBY_CLOSED",
        "The lobby must be closed for play before a local session starts.",
      );
    }
    this.#players = [...lobby.players];
    this.#activePlayerId = this.requirePlayer(initialActivePlayerId).id;
    this.privateInformationExists = privateInformationExists;
  }

  private requirePlayer(playerId: string): Player {
    const player = this.#players.find((candidate) => candidate.id === playerId);
    if (!player) {
      throw new GameModesError(
        "PLAYER_NOT_FOUND",
        `Player ${playerId} is not in this local game.`,
      );
    }
    return player;
  }

  get activePlayer(): Player {
    return this.requirePlayer(this.#activePlayerId);
  }

  handoffTo(nextPlayerId: string): LocalTurnHandoff {
    const previous = this.activePlayer;
    const next = this.requirePlayer(nextPlayerId);
    this.#activePlayerId = next.id;

    return {
      previousPlayerId: previous.id,
      nextPlayerId: next.id,
      requiresPrivacyGate: this.privateInformationExists && previous.id !== next.id,
    };
  }
}
