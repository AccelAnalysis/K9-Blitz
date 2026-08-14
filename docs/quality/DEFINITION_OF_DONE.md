# Definition of Done

A K9 Blitz feature is complete only when all applicable items are satisfied.

- [ ] Rule/content provenance is identified as source-backed physical material or owner-authored versioned digital design.
- [ ] Material digital-rule changes update the authority record and `rulesVersion`/`contentVersion` as applicable.
- [ ] Domain identifiers/data definitions exist.
- [ ] Legal, illegal, and boundary states/actions are specified.
- [ ] State transition is implemented in the authoritative engine/runtime or owning domain package.
- [ ] Random behavior is authoritative for its trust boundary and reproducible in tests.
- [ ] Remote-authoritative accepted mutations increment revision; stale/duplicate commands are safe.
- [ ] Rejections leave authoritative state unchanged.
- [ ] Player-visible/history-relevant outcomes are observable as events/history/state.
- [ ] Positive, negative, and edge-case automated tests pass.
- [ ] Save/restore coverage exists when persistent state is affected.
- [ ] Multiplayer/concurrency coverage exists when remote state is affected.
- [ ] Player-visible interaction does not silently create a second remote authority.
- [ ] Responsive/accessibility acceptance is completed at the appropriate automated/manual layer.
- [ ] A complete-game or representative journey covers the feature when applicable.
- [ ] `npm run qa` passes on the exact candidate commit.
- [ ] Deployment-sensitive changes use `npm run build:pages` and pass the Pages workflow gate.

Missing physical source material is not, by itself, a blocker when the owner authorizes a digital design decision. The decision must be explicit, versioned, testable, and distinguishable from a physical-fidelity claim.
