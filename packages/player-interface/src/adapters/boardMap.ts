import type { BoardSpaceColor, BoardSpaceKind, BoardView, SourceConfidence } from "../model.js";

/** Structural subset of @k9-blitz/board-map BoardDefinition, avoiding a runtime package dependency. */
export interface BoardDefinitionLike {
  readonly name: string;
  readonly source: { readonly assetPath: string };
  readonly spaces: readonly {
    readonly id: string;
    readonly displayLabel?: string;
    readonly kind: BoardSpaceKind;
    readonly color?: BoardSpaceColor;
    readonly anchor: { readonly x: number; readonly y: number };
    readonly confidence: SourceConfidence;
    readonly notes?: string;
  }[];
}

export function boardViewFromDefinition(
  definition: BoardDefinitionLike,
  options: { artworkUrl?: string; pawns?: BoardView["pawns"] } = {},
): BoardView {
  const spaces = definition.spaces.map((space) => ({
    id: space.id,
    label: space.displayLabel ?? space.id,
    anchor: { x: space.anchor.x, y: space.anchor.y },
    kind: space.kind,
    ...(space.color ? { color: space.color } : {}),
    confidence: space.confidence,
    ...(space.notes ? { helpText: space.notes } : {}),
  }));

  return {
    spaces,
    pawns: options.pawns ?? [],
    ...(options.artworkUrl ? { artworkUrl: options.artworkUrl, artworkAlt: definition.name } : {}),
  };
}
