import type {
  EngineFailure,
  EngineResult,
  GameCommand,
  GameState,
} from "./contracts.ts";
import { assertRandomInt, type RandomSource } from "./random.ts";

export interface EngineContext {
  readonly random: RandomSource;
}

function fail(
  state: GameState,
  code: EngineFailure["code"],
  message: string,
): EngineFailure {
  return { ok: false, code, message, state };
}

export function executeCommand(
  state: GameState,
  command: GameCommand,
  context: EngineContext,
): EngineResult {
  if (state.processedCommandIds.includes(command.commandId)) {
    return fail(state, "COMMAND_ALREADY_PROCESSED", `Command ${command.commandId} has already been processed.`);
  }

  if (command.expectedRevision !== state.revision) {
    return fail(state, "STALE_STATE", `Expected revision ${command.expectedRevision}; current revision is ${state.revision}.`);
  }

  if (state.status !== "active") {
    return fail(state, "GAME_NOT_ACTIVE", "The game is not active.");
  }

  if (command.actorPlayerId !== state.currentPlayerId) {
    return fail(state, "NOT_CURRENT_PLAYER", `Player ${command.actorPlayerId} does not own the current turn.`);
  }

  if (command.type === "ROLL_DICE") {
    if (state.turn.phase !== "awaiting_roll") {
      return fail(state, "ACTION_NOT_ALLOWED", `ROLL_DICE is not allowed during ${state.turn.phase}.`);
    }

    const first = assertRandomInt(context.random.nextInt(1, 6), 1, 6);
    const second = assertRandomInt(context.random.nextInt(1, 6), 1, 6);
    const nextRevision = state.revision + 1;

    const nextState: GameState = {
      ...state,
      revision: nextRevision,
      turn: { ...state.turn, phase: "roll_resolved" },
      processedCommandIds: [...state.processedCommandIds, command.commandId],
    };

    return {
      ok: true,
      state: nextState,
      events: [{
        type: "DICE_ROLLED",
        commandId: command.commandId,
        playerId: command.actorPlayerId,
        dice: [first, second],
        total: first + second,
        stateRevision: nextRevision,
      }],
    };
  }

  return fail(state, "ACTION_NOT_ALLOWED", "Unsupported game command.");
}
