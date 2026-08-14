# Player Interface & Game Experience

## Responsibility

This workstream owns player-facing presentation: board viewing, HUD/dashboard, contextual turn guidance, cards/events, animation sequencing, audio cues, help/history, responsive interaction, accessibility, and connection-state feedback.

It does **not** own authoritative gameplay state transitions. It renders the currently active rules/content version and submits player intentions to application orchestration.

## Authoritative flow

```text
Player gesture
   -> PlayerIntent (presentation)
   -> application orchestration
   -> revision-aware GameCommand
   -> authoritative game engine
   -> new GameState + GameEvent(s)
   -> presentation snapshot/events
   -> animation/audio/history
```

Animation or audio failure cannot change the game result. Reconnect replaces presentation with the newest authoritative revision and stale queued visual work is discarded.

## Digital rules authority

The launch product uses **K9 Blitz Digital Rules v1.0**, documented in `docs/DIGITAL_RULES_V1.md`.

Owner-authorized digital rules fill gaps that were not available in the legacy physical references. They are authoritative product design decisions for the digital edition, not assertions that undocumented physical rules were recovered.

The player interface may therefore present complete instructions for:

- 2–4 players and setup-order turn sequence;
- two-die movement using the summed total;
- overshoot-to-Finish behavior with no exact-roll requirement;
- single landing-space resolution;
- immediate Trainer Card resolution and non-cascading card movement;
- Paw Token awards/spending;
- the 8-step K9 Competition Track;
- no persistent hidden hand in v1.0;
- immediate first-to-Finish victory.

## Board integration

Board coordinates use the repository-standard normalized coordinate system: `x` and `y` are each `0..1`. Production artwork/geometry comes from `packages/board-map`; the player interface only renders it. The included adapter maps the structural `BoardDefinition` shape into presentation data without creating a second board truth.

Board artwork and board geometry may have their own provenance/confidence status. That provenance is separate from rule authority: the digital rules are defined even when a future artwork revision changes visual coordinates.

## Responsive experience

Desktop favors a visible player rail + board + active-player dashboard. Tablet keeps the board dominant and compresses player information. Mobile uses a pan/zoom board with a fixed action tray. Pointer drag, wheel zoom, two-finger pinch zoom, full-board reset, and active-player follow are implemented.

## Accessibility

The interface includes semantic controls, text equivalents for connection/dice state, non-color labels for spaces, keyboard-focus treatment, locally persisted sound/music controls, and both OS-driven and explicit reduced-motion behavior.

## Help and tutorial behavior

Help content is product guidance, not a source-fidelity disclaimer. It should explain the active rules version directly and clearly. Contextual space help should state the actual v1.0 effect supplied by rules/content data, while the UI remains unable to invent or mutate effects independently.

If a future rules version changes a player-facing behavior, the rules/content version and help copy must change together.
