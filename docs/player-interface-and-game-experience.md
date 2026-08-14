# Player Interface & Game Experience

## Responsibility

This workstream owns player-facing presentation: board viewing, HUD/dashboard, contextual turn guidance, cards/events, animation sequencing, audio cues, help/history, responsive interaction, accessibility, and connection-state feedback.

It does **not** own authoritative gameplay rules or state transitions.

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

## Board integration

Board coordinates use the repository-standard normalized coordinate system: `x` and `y` are each `0..1`. Production artwork/geometry comes from `packages/board-map`; the player interface only renders it. The included adapter maps the structural `BoardDefinition` shape into presentation data without creating a second board truth.

## Responsive experience

Desktop favors a visible player rail + board + active-player dashboard. Tablet keeps the board dominant and compresses player information. Mobile uses a pan/zoom board with a fixed action tray. Pointer drag, wheel zoom, two-finger pinch zoom, full-board reset, and active-player follow are implemented.

## Accessibility

The interface includes semantic controls, text equivalents for connection/dice state, non-color labels for spaces, keyboard-focus treatment, locally persisted sound/music controls, and both OS-driven and explicit reduced-motion behavior.

## Unresolved physical-game dependencies

Exact turn actions, card text/effects, token meaning, Competition Track behavior, movement rules, hidden information, Finish behavior, and win conditions remain dependent on authoritative physical materials. The UI exposes integration points for them but does not infer them from the photograph.
