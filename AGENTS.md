# K9 Blitz Engineering Guardrails

These rules apply to every implementation lane.

1. **Distinguish legacy evidence from owner-authored digital rules.** Do not present fabricated behavior as a recovered fact about an undocumented physical edition. When the owner explicitly authorizes missing design details to be created, record them as versioned K9 Blitz digital rules/content and treat that committed version as product authority until superseded.
2. **One authority per running game.** Presentation renders state and submits intentions. The GitHub Pages local/pass-and-play runtime owns its single-browser state; remote play must use a trusted authoritative host around the production engine.
3. **Framework-independent production rules engine.** `packages/game-engine` may not import React, rendering engines, database SDKs, transport SDKs, or browser APIs.
4. **Commands in, events/state out for remote authority.** Remote/production mutations pass through typed command validation and produce explicit state transitions/events. The local Pages runtime is a separately versioned shared-device authority, not a model for trusting remote clients.
5. **Randomness matches the trust boundary.** Production/remote dice, card shuffles, token draws, and random events use an authoritative `RandomSource` at the trusted host and record outcomes. Browser randomness is permitted only for the shared-device local Pages game; a remote client may never assert a random outcome as authoritative.
6. **Concurrency is revision-aware.** Remote-authoritative commands carry the game revision they were based on; stale commands fail without mutation.
7. **Content and rules are versioned.** Saved games retain the rule/content versions that created them.
8. **Tests are part of the feature.** New rules/components require positive, negative, edge-case, and persistence/synchronization coverage appropriate to the feature.
9. **Presentation cannot determine correctness.** Animation failure must not change the rules result; the UI must be recoverable from authoritative state.
10. **Unknown is not passing for fidelity claims.** If a feature claims to reproduce a specific physical rule or component, missing evidence remains unverified. Owner-approved digital design decisions are not "unknown" once they are explicitly specified, versioned, and committed.
11. **Digital-rule changes require an authority record.** Material changes to movement, cards, tokens, competition, turn order, hidden information, or victory must update the applicable digital rules document and rules/content version.
12. **Keep rule provenance visible.** Source-backed physical facts, owner-authored digital rules, provisional art/geometry, and implementation-only presentation behavior must not be mislabeled as one another.
13. **`npm run qa` is the canonical repository quality gate.** Pull-request CI and GitHub Pages verification run this exact gate rather than hand-maintained subsets.
14. **Root QA discovers tests automatically.** A package/app test must not require editing a root file list to become enforceable. Dist-based package tests are built as prerequisites by the QA runner.
15. **GitHub Pages is client/local hosting, not a remote authority.** Secure online multiplayer requires authenticated commands, trusted randomness, atomic revision persistence, reconnect recovery, and real transport evidence.

The current owner-authorized launch rules are documented in `docs/DIGITAL_RULES_V1.md`. Rules authority is recorded in `docs/architecture/ADR-0002-owner-authorized-digital-rules.md`; the Pages/online trust boundary is recorded in `docs/architecture/ADR-0003-github-pages-runtime-boundary.md`.
