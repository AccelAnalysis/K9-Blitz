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
- standalone UI showcase adapter for exercising the presentation package.

## Digital rules authority

K9 Blitz Digital Rules v1.0 are defined in `docs/DIGITAL_RULES_V1.md`. Missing legacy-game details are no longer presentation blockers: owner-authorized digital behavior is explicitly specified, versioned, and may be rendered by the interface once supplied by authoritative state/application orchestration.

The presentation package still does **not** decide gameplay correctness. The rule authority change means the product now has defined behavior to consume; it does not move rule execution into React.

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

## Player-experience rules represented by v1.0

The player-facing experience may state the following without provisional/fidelity warnings:

- 2–4 trainers play in setup order;
- each turn rolls two six-sided dice and moves the total;
- an exact roll is not required to reach Finish;
- landing effects resolve once;
- Trainer Card movement does not recursively resolve the destination space;
- Paw Tokens are collected and can be spent by Vet Check;
- K9 Competition progress caps at 8;
- Trainer Cards resolve immediately rather than remaining hidden in a hand;
- the first trainer to reach Finish wins immediately;
- dog profiles are identity/presentation choices in v1.0 and have no hidden mechanical ability.

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

## Board-art handoff

Provide the approved Board/Map artwork via `BoardView.artworkUrl` and board coordinates through the board adapter. Presentation must use the versioned rules/content model for behavior rather than inferring effects from printed colors, labels, or image geometry.
