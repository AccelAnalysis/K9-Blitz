import type { BoardSpaceView } from "../model.js";

export interface CameraState {
  zoom: number;
  panX: number;
  panY: number;
  following: boolean;
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3.25;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function focusSpace(
  space: BoardSpaceView,
  viewportWidth: number,
  viewportHeight: number,
  zoom = 1.85,
): CameraState {
  const nextZoom = clampZoom(zoom);
  const normalizedX = space.anchor.x - 0.5;
  const normalizedY = space.anchor.y - 0.5;

  return {
    zoom: nextZoom,
    panX: -normalizedX * viewportWidth * nextZoom,
    panY: -normalizedY * viewportHeight * nextZoom,
    following: true,
  };
}

export function fullBoardCamera(): CameraState {
  return { zoom: 1, panX: 0, panY: 0, following: false };
}
