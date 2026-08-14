# @k9-blitz/board-map

Board geometry, topology and pawn-placement primitives for **K9 Blitz**.

## Scope

This package owns the repository's **Board, Map & Physical Pieces** lane as currently defined in the root README:

- digital Barkley Ville board representation;
- normalized board coordinate model;
- machine-readable space topology primitives;
- location/hit-region definitions;
- pawn colors, positions and co-location layout;
- a photo-derived calibration reference.

It deliberately does **not** implement dice, Trainer Card rules, Dog Profile Card rules, token mechanics, board-space effects, Competition Track rules, turn order, game-state authority, multiplayer, or player UI. `packages/core-game` owns component/mechanics definitions, including `BoardSpaceMechanicsDefinition` keyed by this package's stable `space.id`; the rules engine owns resolution.

## Source-of-truth rule

`K9_BLITZ_REFERENCE_BOARD` is a development reference, not a claim that the complete physical track has been transcribed. The currently available source is an angled tabletop photograph. The photo is enough to confirm the board's visual target, named areas, colored track, START/FINISH, and visible pawn colors; it is not enough to establish every printed space, route edge, or gameplay rule without inference.

Accordingly:

- verified visual landmarks are encoded;
- START and FINISH are encoded;
- the full route is intentionally **not invented**;
- action/rule identifiers remain outside this package until authoritative material is supplied;
- the reference SVG should be replaced by licensed production artwork or a straight-down production scan for release fidelity.

## Coordinate contract

All durable board coordinates are normalized to `[0, 1]`:

```text
(0,0) ┌───────────────────────┐ (1,0)
      │                       │
      │      Barkley Ville    │
      │                       │
(0,1) └───────────────────────┘ (1,1)
```

This keeps board-space and pawn positions independent of screen resolution. Renderers convert normalized coordinates to pixels using the current viewport.

## Topology contract

Every playable space has stable IDs plus explicit `next[]`/`previous[]` edges. `walkBoard()` can traverse deterministic edges but intentionally throws when a node branches and the caller has not provided a rule-level chooser. The board package owns **where paths connect**, not **which path a game rule selects**.

## Pawn contract

The photographed game visibly includes red, blue, green, yellow and brown pawns. They are represented as canonical colors, while artwork remains swappable. `layoutPawnsOnSpace()` deterministically offsets multiple pawns sharing the same board space so pieces remain visible.

## Validation

```bash
cd packages/board-map
npm install
npm test
```

For repository-level integration, the architecture lane can wire this package into the chosen workspace/build system without moving its domain logic into the UI.
