import type { BoardDefinition, BoardSpace } from "./types.js";

export class BoardTopologyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoardTopologyError";
  }
}

export function indexSpaces(board: BoardDefinition): ReadonlyMap<string, BoardSpace> {
  const index = new Map<string, BoardSpace>();
  for (const space of board.spaces) {
    if (index.has(space.id)) {
      throw new BoardTopologyError(`Duplicate board-space id: ${space.id}`);
    }
    index.set(space.id, space);
  }
  return index;
}

export function validateBoardTopology(board: BoardDefinition): string[] {
  const errors: string[] = [];
  let index: ReadonlyMap<string, BoardSpace>;

  try {
    index = indexSpaces(board);
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }

  for (const space of board.spaces) {
    for (const nextId of space.next) {
      const next = index.get(nextId);
      if (!next) {
        errors.push(`${space.id}.next references missing space ${nextId}`);
      } else if (!next.previous.includes(space.id)) {
        errors.push(`${space.id} -> ${nextId} is not reciprocated by ${nextId}.previous`);
      }
    }

    for (const previousId of space.previous) {
      const previous = index.get(previousId);
      if (!previous) {
        errors.push(`${space.id}.previous references missing space ${previousId}`);
      } else if (!previous.next.includes(space.id)) {
        errors.push(`${previousId} -> ${space.id} is not reciprocated by ${previousId}.next`);
      }
    }
  }

  if (board.startSpaceId && !index.has(board.startSpaceId)) {
    errors.push(`startSpaceId references missing space ${board.startSpaceId}`);
  }
  if (board.finishSpaceId && !index.has(board.finishSpaceId)) {
    errors.push(`finishSpaceId references missing space ${board.finishSpaceId}`);
  }

  return errors;
}

/**
 * Returns the deterministic sequence of spaces for a fixed number of steps.
 * If a node branches, callers must supply chooseNext; the board package never
 * invents game-rule decisions.
 */
export function walkBoard(
  board: BoardDefinition,
  startSpaceId: string,
  steps: number,
  chooseNext?: (space: BoardSpace, options: readonly BoardSpace[]) => BoardSpace,
): BoardSpace[] {
  if (!Number.isInteger(steps) || steps < 0) {
    throw new RangeError("steps must be a non-negative integer");
  }

  const index = indexSpaces(board);
  const start = index.get(startSpaceId);
  if (!start) {
    throw new BoardTopologyError(`Unknown start space: ${startSpaceId}`);
  }

  const path: BoardSpace[] = [];
  let current = start;

  for (let step = 0; step < steps; step += 1) {
    const options = current.next.map((id) => {
      const next = index.get(id);
      if (!next) {
        throw new BoardTopologyError(`${current.id}.next references missing space ${id}`);
      }
      return next;
    });

    if (options.length === 0) break;

    if (options.length > 1 && !chooseNext) {
      throw new BoardTopologyError(
        `Movement from ${current.id} is ambiguous (${options.map((space) => space.id).join(", ")}); a rule-level chooser is required`,
      );
    }

    const next = options.length === 1 ? options[0] : chooseNext!(current, options);
    if (!next || !options.some((option) => option.id === next.id)) {
      throw new BoardTopologyError(`chooseNext returned an invalid destination from ${current.id}`);
    }

    path.push(next);
    current = next;
  }

  return path;
}
