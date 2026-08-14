import type { BoardDefinition } from "./types.js";

/**
 * Photo-derived calibration reference.
 *
 * IMPORTANT: This is intentionally not presented as the final authoritative
 * track topology. The available source is an angled tabletop photograph, and
 * the exact printed space sequence/rules cannot be established reliably from
 * that source alone. Locations below are useful for rendering/calibration and
 * are marked provisional unless their identity is visually unambiguous.
 */
export const K9_BLITZ_REFERENCE_BOARD: BoardDefinition = {
  id: "k9-blitz-barkley-ville-reference",
  name: "K9 Blitz — Barkley Ville",
  version: 1,
  nativeWidth: 1600,
  nativeHeight: 900,
  source: {
    id: "user-photo-2026-08-13-rectified",
    kind: "derived-reference",
    assetPath: "assets/board-reference.svg",
    notes:
      "Development schematic derived from the user-provided tabletop photograph. Use for geometry/reference only; replace with licensed production artwork or a straight-down production scan for final fidelity.",
  },
  locations: [
    {
      id: "start",
      name: "START",
      anchor: { x: 0.095, y: 0.852 },
      hitRegion: { type: "circle", center: { x: 0.095, y: 0.852 }, radius: 0.085 },
      confidence: "verified",
    },
    {
      id: "finish",
      name: "FINISH",
      anchor: { x: 0.9, y: 0.84 },
      hitRegion: { type: "circle", center: { x: 0.9, y: 0.84 }, radius: 0.085 },
      confidence: "verified",
    },
    {
      id: "pawsitive-park",
      name: "Pawsitive Park",
      anchor: { x: 0.226, y: 0.284 },
      hitRegion: { type: "rect", rect: { x: 0.12, y: 0.17, width: 0.23, height: 0.2 } },
      confidence: "verified",
    },
    {
      id: "barkley-ville-hub",
      name: "Barkley Ville",
      anchor: { x: 0.5, y: 0.405 },
      hitRegion: { type: "rect", rect: { x: 0.43, y: 0.31, width: 0.15, height: 0.16 } },
      confidence: "verified",
    },
    {
      id: "trainer-card-area",
      name: "Draw Trainer Cards",
      anchor: { x: 0.386, y: 0.505 },
      hitRegion: { type: "rect", rect: { x: 0.34, y: 0.42, width: 0.09, height: 0.17 } },
      confidence: "verified",
    },
    {
      id: "competition-card-area",
      name: "K9 Competition Track",
      anchor: { x: 0.609, y: 0.505 },
      hitRegion: { type: "rect", rect: { x: 0.565, y: 0.42, width: 0.09, height: 0.17 } },
      confidence: "verified",
    },
    {
      id: "competition-progress-strip",
      name: "K9 Competition Track Progress Strip",
      anchor: { x: 0.5, y: 0.647 },
      hitRegion: { type: "rect", rect: { x: 0.365, y: 0.62, width: 0.27, height: 0.055 } },
      confidence: "verified",
    },
    {
      id: "lower-barkley-ville",
      name: "Barkley Ville",
      anchor: { x: 0.476, y: 0.935 },
      hitRegion: { type: "rect", rect: { x: 0.39, y: 0.84, width: 0.17, height: 0.15 } },
      confidence: "verified",
    },
    {
      id: "the-beach",
      name: "The Beach",
      anchor: { x: 0.93, y: 0.96 },
      hitRegion: { type: "rect", rect: { x: 0.81, y: 0.76, width: 0.19, height: 0.24 } },
      confidence: "verified",
    },
  ],
  spaces: [
    {
      id: "start",
      displayLabel: "START",
      kind: "start",
      anchor: { x: 0.095, y: 0.852 },
      hitRegion: { type: "circle", center: { x: 0.095, y: 0.852 }, radius: 0.075 },
      next: [],
      previous: [],
      locationId: "start",
      confidence: "verified",
      notes: "Topology intentionally unconnected until the printed track can be authoritatively transcribed.",
    },
    {
      id: "finish",
      displayLabel: "FINISH",
      kind: "finish",
      anchor: { x: 0.9, y: 0.84 },
      hitRegion: { type: "circle", center: { x: 0.9, y: 0.84 }, radius: 0.075 },
      next: [],
      previous: [],
      locationId: "finish",
      confidence: "verified",
      notes: "Topology intentionally unconnected until the printed track can be authoritatively transcribed.",
    },
  ],
  startSpaceId: "start",
  finishSpaceId: "finish",
  notes: [
    "The source photograph confirms the board artwork, named landmarks, START/FINISH regions and colored path, but not a reliable complete machine-readable track order.",
    "Do not infer rule behavior from printed colors or labels; action IDs belong to the rules/content workstreams once authoritative rules are supplied.",
  ],
};
