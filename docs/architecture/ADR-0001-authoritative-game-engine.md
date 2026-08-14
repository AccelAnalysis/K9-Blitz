# ADR-0001: Framework-independent authoritative game engine

- **Status:** Accepted
- **Date:** 2026-08-13
- **Scope:** Technology, Architecture & Quality Assurance

## Context

K9 Blitz is a physical board game being recreated digitally. The digital board must remain visually faithful while eventually supporting local play, online multiplayer, persistence, replay, content administration, and automated rule enforcement. The authoritative rulebook and complete component content are not yet present in the repository, so architecture must not silently encode inferred rules.

## Decision

K9 Blitz will use a framework-independent TypeScript game engine as the sole authority for gameplay state transitions.

The engine:

- accepts typed commands;
- validates game status, turn authority, phase, revision, and command reuse before mutation;
- receives randomness through an injected interface;
- produces a new immutable-style state plus explicit domain events;
- contains no React, canvas/WebGL, database, authentication, network, or vendor-specific SDK dependencies;
- records rules/content version identifiers in game state;
- leaves unresolved physical-game behavior unimplemented until authoritative source material establishes it.

## Consequences

- The same engine can power pass-and-play, online multiplayer, automated simulations, and tests.
- Rendering and animation can fail/recover without corrupting game correctness.
- Multiplayer servers can serialize command processing around state revisions.
- Replays and support diagnostics can be reconstructed from state/events.
- Infrastructure vendors can change behind adapters without rewriting rules.
- More explicit contracts are required up front, but this reduces hidden coupling and rules regressions.
