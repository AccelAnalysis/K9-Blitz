# K9 Blitz Test Matrix

Status describes the repository capability after Category 7 convergence. K9 Blitz Digital Rules v1.0 are the current owner-authorized rules authority; physical-fidelity claims retain separate evidence provenance.

| Area | Required coverage | Status |
|---|---|---|
| Engine command boundary | revision, turn owner, phase, duplicate command, rejection/no mutation | Automated in `packages/game-engine` |
| Engine invariants | state shape, versions, turn/order, domain integrity, winner consistency | Automated in `packages/game-engine` |
| Randomness | deterministic injection, bounds, seeded replay behavior | Automated in engine/core-game/complete-game tests |
| Board geometry/topology | topology validation, coordinate normalization, viewport mapping, pawn collision layout | Automated in `packages/board-map` |
| Core mechanics | dice, cards/decks, dogs/progression, tokens/bag, spaces, competition | Automated in `packages/core-game` |
| Rules/turn/history | legal transitions, rule effects, history, winner/finish, revisions | Automated in `packages/game-engine` and local runtime tests |
| Content administration | validation, publication lifecycle, permissions, audit/version contracts | Automated in `packages/game-content-admin` |
| Game modes | Digital Rules v1 lobby constraints, local handoff, online-session/reconnect domain, computer players | Automated in `packages/game-modes` |
| Player-interface helpers | board mapping, camera, presentation queue | Automated in `packages/player-interface` |
| Static local game | dice, movement bounds, space/card effects, turn flow, finish | Automated in `apps/web/test` |
| Full-game simulation | complete deterministic games, valid winner, bounded state, reproducibility | 250-seed four-player Digital Rules v1.0 simulation |
| Local save format | serializable game state with exact rule/content versions | JSON round-trip asserted; UI uses versioned localStorage save |
| Pages artifact | JS syntax, HTML refs, module refs, board SVG, language/viewport/main | Automated by `npm run build:pages` |
| Root test inclusion | every package/app test executed without hand-maintained root file list | Automated discovery plus package coverage audit |
| Architecture boundary | game engine remains framework/infrastructure independent; direct randomness constrained | Automated repository audit |
| Hosted online persistence | atomic durable compare-and-set, trusted randomness, server restart recovery | Architecture/domain ready; requires future trusted backend runtime |
| Hosted online E2E | remote match across real transport with disconnect/reconnect | Requires future trusted backend runtime |
| Visual regression | screenshot-diff desktop/tablet/mobile views | Manual visual acceptance currently; automated browser diff is future enhancement |
| Accessibility browser journey | keyboard/focus/screen-reader/reduced-motion execution | Static semantics/unit helpers exist; manual/browser acceptance remains required |
