import { GameModesError } from "./errors.ts";
import type {
  AuthoritativeTurnView,
  PlayerCommandRequest,
  RevisionAwarePlayerCommand,
} from "./types.ts";

/**
 * Defense-in-depth preflight for a multiplayer/session boundary.
 * The game engine is still authoritative and must repeat revision, player,
 * phase, and command validation before mutating GameState.
 */
export function preflightPlayerCommand<TCommand extends RevisionAwarePlayerCommand>(
  request: PlayerCommandRequest<TCommand>,
  turn: AuthoritativeTurnView,
): void {
  if (request.gameId !== turn.gameId) {
    throw new GameModesError("GAME_ID_MISMATCH", "The command targets a different game.");
  }

  if (request.command.expectedRevision !== turn.revision) {
    throw new GameModesError(
      "STALE_STATE",
      `Expected revision ${request.command.expectedRevision}; current revision is ${turn.revision}.`,
    );
  }

  if (request.command.actorPlayerId !== turn.activePlayerId) {
    throw new GameModesError("NOT_YOUR_TURN", "Only the active player may perform this command.");
  }

  if (!turn.legalCommandTypes.includes(request.command.type)) {
    throw new GameModesError(
      "ILLEGAL_COMMAND",
      `${request.command.type} is not legal in the current rules-engine state.`,
    );
  }
}
