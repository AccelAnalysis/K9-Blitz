# K9 Blitz Engineering Guardrails

These rules apply to every implementation lane.

1. **Preserve rule provenance.** Source-verified physical-game behavior must remain traceable to the rulebook, cards, tokens, player aids, or approved source artwork. When the game owner explicitly authorizes fabrication for missing material, the implementation may synthesize the missing behavior, but it must label that behavior as an **owner-authorized digital rule** (not a transcribed physical rule), assign it a version, and cover it with tests.
2. **One authoritative game state.** UI, animation, audio, and multiplayer clients render state or submit commands; they do not directly mutate authoritative gameplay state.
3. **Framework-independent rules engine.** `packages/game-engine` may not import React, rendering engines, database SDKs, transport SDKs, or browser APIs.
4. **Commands in, events/state out.** Gameplay mutations must pass through typed command validation and produce explicit state transitions/events.
5. **Randomness is injected and recorded.** Dice, card shuffles, token draws, and random events must use an authoritative `RandomSource`, never ad hoc client randomness for authoritative outcomes.
6. **Concurrency is revision-aware.** Commands carry the game revision they were based on; stale commands fail without mutation.
7. **Content and rules are versioned.** Saved games must retain the rule/content versions that created them.
8. **Tests are part of the feature.** New rules/components require positive, negative, edge-case, and persistence/synchronization coverage appropriate to the feature.
9. **Presentation cannot determine correctness.** Animation failure must not change the rules result; the UI must be recoverable from authoritative state.
10. **Unknown is not passing.** If a requirement is neither source-verified nor owner-authorized, QA reports it as blocked/unverified rather than inferring correctness.
