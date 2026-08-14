# K9 Blitz Technical Architecture

## Purpose

Category 7 provides the technical foundation for all other K9 Blitz workstreams. It establishes boundaries now so board rendering, cards, rules, multiplayer, content administration, and future expansions can evolve independently without creating multiple sources of gameplay truth.

## Architectural invariants

1. The illustrated board is presentation; the logical board is data.
2. The rules engine is authoritative for legal state transitions.
3. The client submits intentions, not authoritative outcomes.
4. Random outcomes are generated through an authoritative random source and captured as events.
5. Every accepted state transition increments a monotonic game revision.
6. Saved games retain `rulesVersion` and `contentVersion`.
7. Infrastructure is adapter-based; no database or hosting vendor is selected by this foundation alone.
8. Unknown physical rules remain explicit dependencies rather than implementation guesses.

## Target layers

```text
Presentation
  React UI / board renderer / animation / audio
              |
              v
Application orchestration
  lobby / turn controller / action workflows
              |
              v
Authoritative game engine
  commands / validation / rules / events
              |
              v
Domain state
  game / players / board / decks / tokens / competition
              |
              v
Infrastructure adapters
  persistence / multiplayer transport / auth / content storage
```

Dependencies point downward. The game engine must not import from presentation or infrastructure.

## Repository topology

```text
apps/                     # future runnable applications
packages/
  game-engine/            # framework-independent authoritative transitions
  board-model/            # future logical board graph and coordinates
  game-content/           # future versioned cards/dogs/tokens/challenges
  shared-types/           # only when cross-package contracts justify extraction
docs/
  architecture/
  quality/
.github/workflows/
```

Do not create packages merely to match this diagram; add them when their owning workstream produces real behavior.

## Command boundary

All authoritative mutations enter through a command envelope containing:

- `commandId` for at-most-once processing protection;
- `actorPlayerId` for authority checks;
- `expectedRevision` for stale-state/concurrency detection;
- a command-specific payload.

The bootstrap implementation includes `ROLL_DICE` only to prove the architecture. It intentionally records the authoritative dice result without moving a pawn because movement rules and board topology are not yet authoritative in this repository.

## Event boundary

Accepted commands emit domain events. Events are suitable for animation queues, audio cues, game history, multiplayer broadcasts, persistence/audit trails, and deterministic debugging/replay. Presentation consumes events after the engine has already established the correct state.

## Randomness

Dice, deck shuffles, token draws, and future random events must use `RandomSource`. Online clients must never assert their own dice/card/token outcome as authoritative. Tests inject deterministic sequences. Production infrastructure will provide the authoritative random implementation at the server/session boundary.

## Concurrency and multiplayer

```text
client command
   -> authenticate/session authorize
   -> load authoritative game revision
   -> execute engine command
   -> persist new revision atomically
   -> publish events/snapshot
```

A command based on a stale revision fails without state mutation. Duplicate command identifiers fail safely. The persistence adapter must eventually provide compare-and-set or transactional semantics so two clients cannot both advance the same revision.

## Persistence

No database vendor is chosen in this foundation. The persistence contract must eventually support current authoritative snapshots, immutable or append-oriented event history, game/rules/content versions, atomic revision update, reconnect/resume, and completed-game retention. Vendor selection should be made with the online multiplayer and deployment requirements, not embedded in the rules package.

## Rendering boundary

Board rendering may use React plus a canvas/WebGL renderer such as PixiJS or Phaser, but that choice belongs to the player-experience/board implementation. Renderer responsibilities include board artwork, hit regions, pawn positioning, zoom/pan, animation, and visual effects. It may not decide dice values, legal moves, rewards, or winners.

Normalized board coordinates are recommended for logical-space positions so one board model can scale across desktop, tablet, and mobile layouts.

## Content/version boundary

Cards, dogs, tokens, challenges, space definitions, and expansion content should become data with stable identifiers and immutable published versions. A saved game references the exact published versions it started with so later balancing/content edits cannot mutate a match in progress.

## Security boundary

Treat browser/mobile clients as untrusted for authoritative play. Clients may request actions; the authoritative host validates them. Do not accept client assertions for dice results, card draws, token awards, competition completion, legal movement, or victory.

## Current bootstrap implementation

`packages/game-engine` currently proves framework independence, typed state/command/event contracts, state revisions, turn ownership checks, phase checks, duplicate-command protection, injected/validated dice randomness, explicit events, and deterministic unit tests. It deliberately does not claim the physical K9 Blitz rules are implemented.
