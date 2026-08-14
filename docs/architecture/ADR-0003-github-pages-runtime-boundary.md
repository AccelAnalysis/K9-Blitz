# ADR-0003: GitHub Pages Runtime and Authority Boundary

- Status: Accepted
- Date: 2026-08-13
- Scope: current deployable web release and future online multiplayer

## Context

K9 Blitz is launched from GitHub Pages. Pages is static hosting: it can serve HTML, CSS, JavaScript, and assets, but it cannot itself host a trusted server-authoritative game process. The repository also contains a framework-independent production engine in `packages/game-engine` and a lightweight launch runtime in `apps/web`.

K9 Blitz Digital Rules v1.0 are owner-authorized product authority under ADR-0002. This ADR decides where those rules may execute authoritatively for local versus remote play.

## Decision

1. `apps/web` is the deployable GitHub Pages application for local/pass-and-play play.
2. During a local game, the single browser is authoritative because all participants share the same device and trust boundary. Saved state retains exact rules/content versions.
3. The local Pages runtime is not an authority for remote multiplayer. A remote client submits intentions to a trusted host.
4. `packages/game-engine` remains the framework-independent production authority contract for remote/multiplayer execution. Transport, authentication, and durable persistence wrap the engine through adapters rather than being imported into it.
5. Browser-generated dice/card/token randomness is allowed only in the local Pages ruleset. Remote play resolves randomness at the trusted host and records the result in authoritative events/state.
6. The Pages artifact is assembled by `npm run build:pages`; workflow-specific manual copy lists are prohibited so CI and deployment cannot drift.
7. A material rules/content change publishes new `rulesVersion`/`contentVersion` authority and does not silently mutate an in-progress saved game.

## Consequences

- K9 Blitz can be fully playable locally from GitHub Pages without pretending static hosting provides server security.
- The local game and future online game have an explicit trust boundary.
- Owner-authorized digital rules can ship now while preserving version provenance.
- Online multiplayer requires a separate trusted runtime; GitHub Pages may remain its client host.
