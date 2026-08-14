export type SourceConfidence = "verified" | "authored" | "provisional";

export interface NormalizedPoint {
  /** Horizontal position in board coordinates, from 0 (left) to 1 (right). */
  x: number;
  /** Vertical position in board coordinates, from 0 (top) to 1 (bottom). */
  y: number;
}

export interface NormalizedRect extends NormalizedPoint { width: number; height: number; }
export type HitRegion = | { type: "rect"; rect: NormalizedRect } | { type: "circle"; center: NormalizedPoint; radius: number } | { type: "polygon"; points: NormalizedPoint[] };
export interface BoardSource { id: string; kind: "production-art" | "reference-photo" | "derived-reference"; assetPath: string; notes?: string; }
export interface BoardLocation { id: string; name: string; anchor: NormalizedPoint; hitRegion: HitRegion; confidence: SourceConfidence; notes?: string; }
export type BoardSpaceKind = "start" | "track" | "action" | "finish";
export interface PawnAnchor { x: number; y: number; }
export interface BoardSpace {
  /** Stable machine identifier. Do not derive this from printed artwork. */ id: string;
  /** Printed or production-authored value/label shown for the digital edition. */ displayLabel?: string;
  kind: BoardSpaceKind;
  color?: "red" | "blue" | "green" | "yellow" | "orange" | "black" | "other";
  anchor: NormalizedPoint; hitRegion: HitRegion; next: string[]; previous: string[]; locationId?: string;
  /** verified = source-backed; authored = owner-authorized release completion; provisional = development-only. */ confidence: SourceConfidence;
  pawnAnchors?: PawnAnchor[]; notes?: string;
}
export interface BoardDefinition { id: string; name: string; version: number; nativeWidth: number; nativeHeight: number; source: BoardSource; locations: BoardLocation[]; spaces: BoardSpace[]; startSpaceId?: string; finishSpaceId?: string; notes?: string[]; }
export const CANONICAL_PAWN_COLORS = ["red", "blue", "green", "yellow", "brown"] as const;
export type PawnColor = (typeof CANONICAL_PAWN_COLORS)[number];
export interface PawnState { id: string; playerId: string; color: PawnColor; spaceId: string; }
export interface PositionedPawn extends PawnState { position: NormalizedPoint; }
export interface BoardViewport { width: number; height: number; zoom: number; offsetX: number; offsetY: number; }
