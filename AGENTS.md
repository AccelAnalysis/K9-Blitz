# K9 Blitz Engineering Guardrails

These rules apply to every implementation lane.

1. **Distinguish legacy evidence from owner-authored digital rules.** Do not present fabricated behavior as a recovered fact about an undocumented physical edition. When the owner explicitly authorizes missing design details to be created, record them as versioned K9 Blitz digital rules/content and treat that committed version as product authority until superseded.
2. **One authoritative game state.** UI, animation, audio, and multiplayer clients render state or submit commands; they do not directly mutate authoritative gameplay state.
3. **Framework-independent rules engine.** `packages/game-engine` may not import React, rendering engines, database SDKs, transport SDKs, or browser APIs.
4. **Commands in, events/state out.** Gameplay mutations must pass through typed command validation and produce explicit state transitions/events.
5. **Randomness is injected and recorded.** Dice, card shuffles, token draws, and random events must use an authoritative `RandomSource`, never ad hoc client randomness for authoritative outcomes.
6. **Concurrency is revision-aware.** Commands carry the game revision they were based on; stale commands fail without mutation.
7. **Content and rules are versioned.** Saved games must retain the rule/content versions that created them.
8. **Tests are part of the feature.** New rules/components require positive, negative, edge-case, and persistence/synchronization coverage appropriate to the feature.
9. **Presentation cannot determine correctness.** Animation failure must not change the rules result; the UI must be recoverable from authoritative state.
10. **Unknown is not passing for fidelity claims.** If a feature claims to reproduce a specific physical rule or component, missing evidence remains unverified. Owner-approved digital design decisions are not "unknown" once they are explicitly specified, versioned, and committed.
11. **Digital-rule changes require an authority record.** Material changes to movement, cards, tokens, competition, turn order, hidden information, or victory must update the applicable digital rules document and rules/content version.
12. **Keep rule provenance visible.** Source-backed physical facts, owner-authored digital rules, provisional art/geometry, and implementation-only presentation behavior must not be mislabeled as one another.

The current owner-authorized launch rules are documented in `docs/DIGITAL_RULES_V1.md`.