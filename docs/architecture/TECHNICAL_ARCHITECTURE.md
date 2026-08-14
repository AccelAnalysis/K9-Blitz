# K9 Blitz Technical Architecture

## Purpose

Category 7 defines the technical and quality contracts that let the board, mechanics, rules, UI, modes, content administration, and deployment evolve without losing gameplay correctness.

The digital-game specification calls for a visual recreation, a standalone TypeScript rules engine, machine-readable game state, local and online modes, persistence, and automated coverage for spaces, cards, tokens, legal/illegal movement, synchronization, reconnect, and restoration. The repository implements those concerns as separable layers. K9 Blitz Digital Rules v1.0 are the current owner-authorized product authority (`docs/DIGITAL_RULES_V1.md`, ADR-0002).

## Architectural invariants

1. Illustrated board artwork is presentation; logical board topology/coordinates are data.
2. A running game has exactly one authority inside its trust boundary.
3. Production rules logic remains framework independent.
4. Remote commands represent intent; accepted commands produce state transitions and events.
5. Random outcomes are reproducible in tests and authoritative at the applicable host.
6. Remote concurrency uses monotonic revisions and at-most-once command identifiers.
7. Saved games carry `rulesVersion` and `contentVersion`.
8. Owner-authored digital rules and source-backed physical facts preserve distinct provenance.
9. CI and deployment use one canonical quality gate: `npm run qa`.

## Current repository topology

```text
apps/
  web/                    Static GitHub Pages local/pass-and-play application

packages/
  board-map/              Board geometry, topology, normalized coordinates, pawn layout
  core-game/              Dice, Trainer Cards, dogs, tokens, space actions, competition primitives
  game-content-admin/     Versioned content/admin validation, permissions, publication services
  game-engine/            Framework-independent authoritative state/command/event engine
  game-modes/             Lobby, local handoff, online-session/reconnect domain, computer players
  player-interface/       React player-experience components and pure presentation helpers

tools/qa/                 Test discovery, architecture audit, Pages artifact builder

docs/architecture/        Architecture decisions and boundaries
docs/quality/             QA strategy, matrix, Definition of Done, release gates
.github/workflows/         Pull-request/main CI and GitHub Pages deployment
```

## Runtime model

### GitHub Pages local release

```text
apps/web UI + local runtime
   -> K9 Blitz Digital Rules v1.0
   -> single-browser game authority
   -> versioned localStorage save
```

All participants share the device, so the browser is the authority for that local game. This is a deliberate trust boundary, not a server-security claim.

### Production remote/online target

```text
remote client
   -> authenticated command
   -> trusted session/service
   -> packages/game-engine
   -> atomic snapshot/event persistence
   -> authoritative events/snapshot broadcast
```

Remote clients never submit dice values, card draws, token awards, legal destinations, competition completion, or winners as authoritative outcomes.

## Command and event boundary

Production remote commands carry `commandId` for at-most-once processing, actor identity for authority checks, `expectedRevision` for stale-state rejection, and typed payload. Accepted commands emit domain events suitable for history, animation, audio, persistence, synchronization, replay, and support evidence.

The Pages runtime is intentionally simpler because it is a shared-device authority. Its behavior is still versioned and tested, but it is not the security model for online play.

## Randomness

`packages/game-engine` uses an injected `RandomSource`. Deterministic seeded sources support tests, replay fixtures, and reproducible defect reports. Browser randomness in `apps/web` is acceptable only for local shared-device play. Remote multiplayer resolves randomness at the trusted host.

## Board and content boundaries

`packages/board-map` owns logical geometry/topology; renderers own pixels, camera behavior, and visual effects. `packages/core-game` owns reusable component mechanics. `packages/game-content-admin` owns versioned publication/validation concerns. Rule decisions are not hidden inside presentation-only components.

Normalized board coordinates allow one logical map to scale across desktop, tablet, and mobile. Published content uses stable identifiers so artwork can be replaced without changing gameplay identity.

## Persistence and versioning

The current Pages release persists a versioned local snapshot. Future online persistence must support atomic revision replacement, append-oriented/immutable history, reconnect, exact rules/content version retention, and completed-game retention.

Rules/content changes publish a new authority version. Existing saves continue under the version that created them unless an explicit migration exists.

## Quality architecture

`npm run qa` is the executable repository acceptance surface:

```text
strict TypeScript check
  -> repository architecture audit
  -> automatic discovery of every package/app/tool test
  -> prerequisite package builds for dist-based tests
  -> deterministic unit/domain/integration/complete-game tests
  -> GitHub Pages artifact assembly
  -> static syntax/reference/semantic smoke checks
```

This prevents a new lane from adding tests that root CI never executes. The architecture audit also protects the framework-independent game-engine boundary and canonical deployment commands.

## Hosting boundary

GitHub Pages is sufficient for the current local/pass-and-play release, computer players, responsive board, save/resume, and help experience. Secure remote multiplayer requires a trusted backend/session host and cannot be created by trusting browser JavaScript. See ADR-0003.
