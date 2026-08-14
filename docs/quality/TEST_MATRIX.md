# K9 Blitz Test Matrix

`Blocked` means authoritative game material or the owning implementation does not yet exist. It does not mean the behavior passed.

| Area | Required coverage | Current status | Activation dependency |
|---|---|---|---|
| Engine command boundary | revision, turn owner, phase, duplicate command, rejection no-mutation | Implemented | None |
| Authoritative randomness | deterministic injection, bounds validation, event capture | Implemented (dice bootstrap) | None |
| Board topology | every space, adjacency, branches, normalized coordinates, finish behavior | Blocked | Authoritative board map/rules |
| Movement | standard roll, boundaries, special movement, exact/overshoot finish behavior | Blocked | Rulebook + board topology |
| Trainer cards | every card effect, target, duration, discard/hold behavior, illegal use | Blocked | Complete Trainer Card inventory + rules |
| Dog profiles | attributes, skills, progression, ownership, special abilities | Blocked | Complete Dog Card inventory + rules |
| Tokens/token bag | draw distribution contract, inventory, award/spend/return limits | Blocked | Token inventory + rules |
| Board-space actions | action trigger exactly once; prerequisites; reward/penalty | Blocked | Space catalog + rules |
| Competition track | progression, eligibility, rewards, completion | Blocked | Competition rules |
| Turn controller | complete legal phase graph and illegal transitions | Partially implemented | Complete turn rules |
| Win/finish | all legitimate completion paths and tie/edge cases | Blocked | Win-condition rules |
| Save/restore | round-trip every significant phase with exact versions/revision | Planned | Persistence adapter + complete state domains |
| Multiplayer sync | same revision across clients; stale/duplicate/concurrent commands | Planned | Multiplayer/persistence adapter |
| Reconnect | restore snapshot + unresolved interaction without double resolution | Planned | Online multiplayer |
| E2E local game | full pass-and-play match to legitimate winner | Blocked | Complete rules engine + UI |
| E2E online game | remote match, disconnect/reconnect, completion | Blocked | Online multiplayer |
| Visual regression | canonical board/card/modal views by viewport | Blocked | Production digital assets + renderer |
| Accessibility | keyboard, focus, labels, reduced motion, sound controls, non-color cues | Planned | Player UI |
| Headless simulation | thousands of complete legal games without invalid/endless states | Blocked | Complete rules engine |
