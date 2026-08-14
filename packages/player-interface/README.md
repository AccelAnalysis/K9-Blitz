# K9 Blitz Player Interface & Game Experience

This package implements workstream **4 — Player Interface & Game Experience** as a modular React/TypeScript presentation surface. It follows the repository guardrails: one authoritative game state, client intentions rather than client-authored outcomes, normalized board coordinates, and presentation that can recover from authoritative revisions.

## Implemented

- board-centric digital tabletop shell;
- canonical `0..1` normalized board coordinates compatible with `packages/board-map`;
- structural `boardViewFromDefinition` adapter for the Board/Map package without introducing a runtime dependency;
- pan, wheel zoom, two-finger pinch zoom, full-board reset, and active-player follow;
- coordinate-driven board-space hit areas and pawn rendering;
- collision-aware multiple-pawn offsets;
- current-player rail and digital dog/player dashboard;
- context-driven turn prompt and legal-intent controls;
- non-authoritative `PlayerIntent` boundary for application orchestration to convert into revision-aware engine commands;
- two-die presentation with rolling/settled UI states;
- card/event/token modal architecture with choices;
- contextual board help and general digital-table help;
- game-history drawer;
- connection/synchronization blocking states;
- authoritative revision indicator;
- player experience settings persisted locally;
- event-driven sound-effect/music controller with injectable production audio assets;
- reduced-motion support and responsive desktop/tablet/mobile layout;
- revision-aware presentation queue that drops stale animation work after reconnect;
- Node-native unit tests for camera helpers, board adaptation, and presentation queue;
- demo adapter explicitly labeled as non-authoritative.

## Integration contract

`GameExperience` consumes an immutable `GameExperienceSnapshot`, legal UI intentions, and an intention dispatcher.

```tsx
<GameExperience
  snapshot={authoritativePresentationSnapshot}
  legalIntents={legalIntents}
  onIntent={submitIntentToApplicationOrchestration}
/>
```

`PlayerIntent` is **not** a game mutation. Application orchestration must attach command identity, actor authority, and `expectedRevision` before invoking the authoritative game engine.

The Board/Map layer provides normalized logical-space anchors and may provide production artwork. `boardViewFromDefinition` accepts the structural subset already exposed by `@k9-blitz/board-map`.

## Source-data boundary

The available photograph/description establishes visible concepts but not exact gameplay behavior. The demo path exists only to exercise presentation states and remains provisional. This package does not define authentic setup, movement, card effects, token effects, Competition Track rules, penalties/rewards, hidden-information rules, or win conditions.

## Run this package standalone

```bash
cd packages/player-interface
npm install
npm run dev
```

## Validate

```bash
npm run qa
```

## Production asset handoff

The fallback demo board is deliberately not production artwork. Provide the finalized Board/Map artwork via `BoardView.artworkUrl` and authoritative coordinates through the board adapter. Presentation must never infer rules from printed colors, labels, or image geometry.
