# Board, Map & Physical Pieces — production implementation

Category 1 is now implemented as a **production digital board system**, not a development-only calibration reference.

## Production status

The owner has confirmed full rights and ownership of the K9 Blitz artwork and explicitly authorized completion where the project-source image does not expose exact machine-readable geometry.

The repository carries two separate board definitions:

- `K9_BLITZ_PRODUCTION_BOARD` — the release board used by the digital game.
- `K9_BLITZ_REFERENCE_BOARD` — retained only as a historical calibration/reference artifact.

The production board is complete, connected from START to FINISH, and backed by release artwork in `packages/board-map/assets/board-production.svg`.

## Implemented

- production Barkley Ville vector board artwork derived from the owner-provided project source;
- 1600 × 900 scalable release canvas aligned to the GitHub Pages tabletop;
- complete 72-space START → FINISH machine-readable route;
- stable `space-0` through `space-71` identifiers;
- normalized `[0,1]` coordinates and hit regions;
- explicit reciprocal `next[]` / `previous[]` graph topology;
- Pawsitive Park, K9 Academy, Doggy Daycare, Trainer Cards, K9 Competition Track, Vet and The Beach visual regions;
- production red, blue, green, yellow and brown dog-pawn artwork;
- live Pages pawn rendering wired to production SVG pieces;
- source-confidence metadata distinguishing directly verified source details from owner-authorized authored completion;
- production-board validation tests and Pages artifact gates.

## Authored completion policy

Source-backed names/landmarks are `verified`. Exact geometry completed under the owner's authorization is `authored`, an intentional digital-edition decision rather than an uncertain estimate. `provisional` remains reserved for non-release experiments.

## Cross-workstream contract

Other workstreams consume stable `space.id`, normalized anchors, location IDs, `K9_BLITZ_PRODUCTION_BOARD`, `K9_BLITZ_PAWN_ASSETS`, and topology helpers. Dice, card, token, competition, turn, persistence and multiplayer behavior remains with the rules/components packages.

## Release assets

```text
packages/board-map/assets/board-production.svg
packages/board-map/assets/asset-manifest.json
packages/board-map/assets/pawns/pawn-red.svg
packages/board-map/assets/pawns/pawn-blue.svg
packages/board-map/assets/pawns/pawn-green.svg
packages/board-map/assets/pawns/pawn-yellow.svg
packages/board-map/assets/pawns/pawn-brown.svg
```

GitHub Pages publishes `board-production.svg` as the playable board; `board-reference.svg` remains historical calibration material only.
