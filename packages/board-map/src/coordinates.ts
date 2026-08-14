import type { BoardViewport, NormalizedPoint, NormalizedRect } from "./types.js";

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

export function assertNormalized(value: number, name = "coordinate"): number {
  assertFinite(value, name);
  if (value < 0 || value > 1) {
    throw new RangeError(`${name} must be between 0 and 1; received ${value}`);
  }
  return value;
}

export function normalizePixels(
  x: number,
  y: number,
  boardWidth: number,
  boardHeight: number,
): NormalizedPoint {
  assertFinite(boardWidth, "boardWidth");
  assertFinite(boardHeight, "boardHeight");
  if (boardWidth <= 0 || boardHeight <= 0) {
    throw new RangeError("board dimensions must be greater than zero");
  }

  return {
    x: assertNormalized(x / boardWidth, "x"),
    y: assertNormalized(y / boardHeight, "y"),
  };
}

export function denormalizePoint(
  point: NormalizedPoint,
  boardWidth: number,
  boardHeight: number,
): { x: number; y: number } {
  assertNormalized(point.x, "point.x");
  assertNormalized(point.y, "point.y");
  if (boardWidth <= 0 || boardHeight <= 0) {
    throw new RangeError("board dimensions must be greater than zero");
  }
  return { x: point.x * boardWidth, y: point.y * boardHeight };
}

export function boardToViewport(point: NormalizedPoint, viewport: BoardViewport): { x: number; y: number } {
  assertNormalized(point.x, "point.x");
  assertNormalized(point.y, "point.y");
  if (viewport.width <= 0 || viewport.height <= 0 || viewport.zoom <= 0) {
    throw new RangeError("viewport width, height and zoom must be greater than zero");
  }

  return {
    x: point.x * viewport.width * viewport.zoom + viewport.offsetX,
    y: point.y * viewport.height * viewport.zoom + viewport.offsetY,
  };
}

export function viewportToBoard(
  point: { x: number; y: number },
  viewport: BoardViewport,
): NormalizedPoint {
  if (viewport.width <= 0 || viewport.height <= 0 || viewport.zoom <= 0) {
    throw new RangeError("viewport width, height and zoom must be greater than zero");
  }

  return {
    x: (point.x - viewport.offsetX) / (viewport.width * viewport.zoom),
    y: (point.y - viewport.offsetY) / (viewport.height * viewport.zoom),
  };
}

export function rectContains(rect: NormalizedRect, point: NormalizedPoint): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}
