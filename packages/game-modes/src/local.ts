import { GameModesError } from "./errors.js";
import type { LobbyState, Player } from "./types.js";

export interface LocalTurnHandoff {
  readonly previousPlayerId: string | null;
  readonly nextPlayerId: string;
  readonly requiresPrivacyGate: boolean;
}

export class LocalPassAndPlaySession {
  readonly #players: readonly Player[];
  #activeSeatIndex = 0;
  private readonly privateInformationExists: boolean;

  constructor(lobby: LobbyState, privateInformationExists: boolean) {
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
    this.privateInformationExists = privateInformationExists;
    this.#players = [...lobby.players].sort((a, b) => a.seatNumber - b.seatNumber);
  }

  get activePlayer(): Player {
    const player = this.#players[this.#activeSeatIndex];
    if (!player) {
      throw new GameModesError("PLAYER_NOT_FOUND", "No active local player exists.");
    }
    return player;
  }

  advanceTurn(): LocalTurnHandoff {
    const previous = this.activePlayer;
    this.#activeSeatIndex = (this.#activeSeatIndex + 1) % this.#players.length;
    const next = this.activePlayer;

    return {
      previousPlayerId: previous.id,
      nextPlayerId: next.id,
      requiresPrivacyGate: this.privateInformationExists && previous.id !== next.id,
    };
  }
}
