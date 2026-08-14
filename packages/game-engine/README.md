# K9 Blitz Game Engine

`packages/game-engine` is the framework-independent authority for K9 Blitz rules execution, turns, game state, and game history.

## Current production rules authority

The owner-authorized launch rules are defined in `docs/DIGITAL_RULES_V1.md` and implemented here by `src/digitalRulesV1.ts`.

- Rules ID / engine rules version: `k9-blitz-digital-1.0`
- Content version: `launch-1.0`
- Provenance: owner-authorized digital rules
- Supported launch play: 2–4 local/pass-and-play seats with optional computer-controlled seats

The physical references remain evidence for physical-game facts. Where those references did not establish behavior, the committed Digital Rules v1 specification is product authority rather than an unresolved placeholder.

## Implemented responsibilities

- version-bound, JSON-serializable authoritative `GameState`;
- optimistic concurrency through `expectedRevision` on every command;
- duplicate-command rejection before a mutation can execute twice;
- turn-order and turn-phase state machine;
- state-derived legal actions for the active player;
- injected authoritative dice randomness with recorded outcomes;
- movement-path and landing-event recording without coupling correctness to animation;
- ordered rule-effect queue;
- domain-effect resolution for Trainer Cards, Paw Tokens, board spaces, Competition progress, and extra turns;
- automatic Digital Rules v1 turn completion;
- victory transition and completed-game lockout;
- pause/resume without losing turn position;
- semantic append-only game history;
- card/token/state/event invariants;
- exact rules + content version compatibility checks for saved games and reconnects.

## Digital Rules v1 behavior

The concrete runtime implements the canonical launch rules:

- setup-order seats and turn order; Player 1 starts;
- canonical setup-order pawns: red, blue, green, yellow;
- player-selected dog profiles with no v1 stat modifiers;
- 72 spaces, Start `space-0`, Finish `space-71`;
- two six-sided dice; move by total; no doubles bonus; no exact Finish roll;
- one landing-space resolution per normal roll;
- Paw Bonus, K9 Academy, Obedience, Daycare, Agility, Treat, Vet, Trainer Card, Competition, and Finish effects;
- Paw Tokens as non-negative reward/spend counters represented by unique state IDs;
- K9 Competition progress capped at 8 and not required for victory;
- 12 public, immediate-resolution Trainer Cards in canonical cyclic order;
- Trainer Card movement does not trigger the destination space;
- Second Chance grants one immediate extra turn;
- first trainer to reach Finish wins.

## RulesRuntime boundary

Gameplay semantics are supplied through the versioned `RulesRuntime` interface:

- `rollDice()`;
- `calculateMovement()`;
- `getLandingEffects()`;
- `resolveDomainEffect()`;
- `evaluateVictory()`;
- optional `getNextPlayerId()`.

Clients submit intent and consume returned state/events. UI, animation, persistence, authentication, and multiplayer transports remain outside the rules core.

## Command model

Supported control commands are:

- `START_GAME`
- `ROLL_DICE`
- `CHOOSE_OPTION`
- `END_TURN`
- `PAUSE_GAME`
- `RESUME_GAME`

Every command carries `commandId`, `actorPlayerId`, and `expectedRevision`. A stale revision or previously processed command is rejected without mutation.

## Turn model

```text
ready
  -> START_GAME
active / awaiting_roll
  -> ROLL_DICE
  -> resolving movement + landing/card effects
  -> automatic TURN_ENDED
  -> next awaiting_roll
```

The generic engine still supports blocking decisions and manual-turn policies for future rules variants; Digital Rules v1 uses automatic completion.

## Repository QA

From the repository root:

```bash
npm run qa
```
