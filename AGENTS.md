# K9 Blitz Engineering Guardrails

These rules apply to every implementation lane.

1. **Source fidelity plus authorized design completion.** Use the physical rulebook, cards, tokens, player aids, artwork, and owner-provided source material when available. When a source behavior is unavailable **and the game owner has explicitly authorized design/fabrication**, a lane may complete the missing behavior as a versioned digital rule/content decision. Such decisions must be documented as owner-authorized digital design and must not be falsely described as transcribed or verified physical-game rules.
2. **One authoritative game state.** UI, animation, audio, and multiplayer clients render state or submit commands; they do not directly mutate authoritative gameplay state.
3. **Framework-independent rules engine.** `packages/game-engine` may not import React, rendering engines, database SDKs, transport SDKs, or browser APIs.
4. **Commands in, events/state out.** Gameplay mutations must pass through typed command validation and produce explicit state transitions/events.
5. **Randomness is injected and recorded.** Dice, card shuffles, token draws, and random events must use an authoritative `RandomSource`, never ad hoc client randomness for authoritative outcomes.
6. **Concurrency is revision-aware.** Commands carry the game revision they were based on; stale commands fail without mutation.
7. **Content and rules are versioned.** Saved games must retain the rule/content versions that created them.
8. **Tests are part of the feature.** New rules/components require positive, negative, edge-case, and persistence/synchronization coverage appropriate to the feature.
9. **Presentation cannot determine correctness.** Animation failure must not change the rules result; the UI must be recoverable from authoritative state.
10. **Provenance is part of correctness.** A source-observed physical behavior, an owner-authorized digital design decision, and an unresolved question are three different states and must remain distinguishable in documentation and content metadata. Owner-authorized digital rules may be production-authoritative for the digital edition even when physical-rule fidelity has not been independently verified.
