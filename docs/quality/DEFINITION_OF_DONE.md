# Definition of Done

A K9 Blitz gameplay feature is complete only when all applicable items are satisfied.

- [ ] Authoritative physical-game source for the behavior is identified.
- [ ] Domain identifiers/data definitions exist.
- [ ] Legal and illegal states/actions are specified.
- [ ] State transition is implemented in the authoritative engine or owning domain package.
- [ ] Random behavior is injected/authoritative and reproducible in tests.
- [ ] Accepted mutations increment the game revision.
- [ ] Rejections leave authoritative state unchanged.
- [ ] Domain events are emitted for player-visible/history-relevant outcomes.
- [ ] Positive, negative, and edge-case unit tests pass.
- [ ] Save/restore coverage exists when persistent state is affected.
- [ ] Multiplayer/concurrency coverage exists when remote authoritative state is affected.
- [ ] Player-visible interaction is implemented without duplicating rule logic in the UI.
- [ ] Responsive/accessibility acceptance is complete for player-visible behavior.
- [ ] Game-history/debug evidence is sufficient to reproduce a failure.
- [ ] CI is green on the exact candidate commit.

If authoritative rules/assets are missing, the item remains **Blocked/Unverified**; it is not completed by inference.
