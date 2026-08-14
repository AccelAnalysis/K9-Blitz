import type { BoardSpace, NormalizedPoint, PawnState, PositionedPawn } from "./types.js";

const DEFAULT_OFFSETS = [
  { x: 0, y: 0 },
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: 1, y: 1 },
] as const;

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Places co-located pawns around a space anchor so they remain individually
 * visible. `spread` is expressed in normalized board coordinates.
 */
export function layoutPawnsOnSpace(
  space: BoardSpace,
  pawns: readonly PawnState[],
  spread = 0.012,
): PositionedPawn[] {
  if (spread < 0 || !Number.isFinite(spread)) {
    throw new RangeError("spread must be a finite non-negative number");
  }

  const sorted = [...pawns].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map((pawn, index) => {
    const custom = space.pawnAnchors?.[index];
    const fallback = DEFAULT_OFFSETS[index] ?? {
      x: Math.cos((Math.PI * 2 * index) / sorted.length),
      y: Math.sin((Math.PI * 2 * index) / sorted.length),
    };
    const offset = custom ?? fallback;
    const position: NormalizedPoint = {
      x: clamp(space.anchor.x + offset.x * spread),
      y: clamp(space.anchor.y + offset.y * spread),
    };

    return { ...pawn, position };
  });
}
