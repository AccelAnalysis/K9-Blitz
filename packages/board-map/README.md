# @k9-blitz/board-map

Production board geometry, topology and physical-piece artwork for **K9 Blitz**.

## Release source of truth

Use `K9_BLITZ_PRODUCTION_BOARD` for release/runtime geometry. It is the owner-authorized 72-space Digital Rules v1 Barkley Ville route backed by `assets/board-production.svg`.

The owner source establishes the physical game's visual identity and major landmarks. Release values are classified as `verified` when source-backed, `authored` when deliberately completed for the production digital edition, and `provisional` only for non-release experiments.

`K9_BLITZ_REFERENCE_BOARD` remains historical calibration material and must not be selected by production clients.

## Coordinate/topology contract

All durable coordinates are normalized to `[0,1]`. The release route is `space-0` (START) through `space-71` (FINISH), with reciprocal `next[]`/`previous[]` edges. `walkBoard()` remains generic for future branched editions.

## Pawn contract

Red, blue, green, yellow and brown production dog-pawn SVGs live under `assets/pawns/` and are registered through `K9_BLITZ_PAWN_ASSETS`. `layoutPawnsOnSpace()` provides deterministic offsets for co-located pieces.

## Assets

- `assets/board-production.svg` — release board artwork.
- `assets/asset-manifest.json` — production inventory/provenance.
- `assets/pawns/*.svg` — production dog pawns.
- `assets/board-reference.svg` — historical development schematic.

## Validation

```bash
npm run qa
```

Repository QA discovers the board-map dist-backed tests, validates all 72 spaces, START/FINISH reachability, pawn inventory and the canonical Pages artifact.
