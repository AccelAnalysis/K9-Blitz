import { GameModesError } from "./errors.js";
import type {
  AuthoritativeTurnView,
  CommandEnvelope,
  TypedCommand,
} from "./types.js";

export function authorizePlayerCommand<TCommand extends TypedCommand>(
  envelope: CommandEnvelope<TCommand>,
  turn: AuthoritativeTurnView,
): void {
  if (envelope.gameId !== turn.gameId) {
    throw new GameModesError("GAME_ID_MISMATCH", "The command targets a different game.");
  }

  if (envelope.playerId !== turn.activePlayerId) {
    throw new GameModesError("NOT_YOUR_TURN", "Only the active player may perform this command.");
  }

  if (!turn.legalCommandTypes.includes(envelope.command.type)) {
    throw new GameModesError(
      "ILLEGAL_COMMAND",
      `${envelope.command.type} is not legal in the current rules-engine state.`,
    );
  }
}
