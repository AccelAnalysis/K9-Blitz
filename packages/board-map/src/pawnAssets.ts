import type { PawnColor } from "./types.js";
export interface PawnAssetDefinition { readonly color: PawnColor; readonly label: string; readonly assetPath: string; readonly alt: string; }
export const K9_BLITZ_PAWN_ASSETS: readonly PawnAssetDefinition[] = [
  { color: "red", label: "Red", assetPath: "assets/pawns/pawn-red.svg", alt: "Red K9 Blitz dog pawn" },
  { color: "blue", label: "Blue", assetPath: "assets/pawns/pawn-blue.svg", alt: "Blue K9 Blitz dog pawn" },
  { color: "green", label: "Green", assetPath: "assets/pawns/pawn-green.svg", alt: "Green K9 Blitz dog pawn" },
  { color: "yellow", label: "Yellow", assetPath: "assets/pawns/pawn-yellow.svg", alt: "Yellow K9 Blitz dog pawn" },
  { color: "brown", label: "Brown", assetPath: "assets/pawns/pawn-brown.svg", alt: "Brown K9 Blitz dog pawn" },
] as const;
