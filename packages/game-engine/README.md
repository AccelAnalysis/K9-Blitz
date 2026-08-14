# K9 Blitz Game Engine

`packages/game-engine` is the framework-independent authority for K9 Blitz rules execution, turns, game state, and game history.

## Production rules runtime

The repository now includes an owner-authorized production ruleset:

- runtime: `src/digitalRulesV1.ts`;
- ruleset ID: `k9-blitz-digital`;
- rules version: `1.0.0`;
- content version: `digital-base-1.0.0`;
- canonical specification: `../../docs/K9_BLITZ_DIGITAL_RULES_V1.md`.

The physical references establish K9 Blitz's visible board/components. Where exact physical semantics are unavailable, the owner has authorized explicit digital design completion. Those rules are production-authoritative for the digital edition and remain distinguishable from source-transcribed physical facts.

## Implemented responsibilities

- version-bound, JSON-serializable authoritative `GameState`;
- optimistic concurrency through `expectedRevision` on every command;
- duplicate-command rejection before a mutation can execute twice;
- turn-order and turn-phase state machine;
- state-derived legal actions for the active player;
- injected authoritative randomness with recorded random outcomes;
- movement-path and landing-event recording without coupling correctness to animation;
- ordered rule-effect queue with blocking player choices;
- domain-effect adapter boundary for cards, dogs, tokens, spaces, and competition mechanics;
- manual or automatic turn completion;
- victory transition and completed-game lockout;
- pause/resume without losing turn position;
- semantic append-only game history;
- card/token/state/event invariants;
- exact rules + content version compatibility checks for saved games and reconnects;
- concrete K9 Blitz Digital Rules v1 behavior for the 72-space race, two dice, Trainer Cards, Paw Tokens, Competition progress, and Finish victory.

## Digital Rules v1 decisions

The v1 runtime establishes:

- 2–4 players;
- two six-sided dice, movement by total, no doubles bonus, no exact roll required at Finish;
- 72 logical spaces from `space-0` START through `space-71` FINISH;
- named training, Vet, token, Trainer Card, and Competition spaces;
- Competition progress capped at 8;
- Paw Token score markers beginning with 48 concrete instances and replenishing with unique virtual instances if needed;
- 12 immediate-resolution Trainer Cards drawn randomly without replacement until discard recycling;
- card-driven movement that does not retrigger the destination board-space action;
- `Second Chance` one-turn extra-turn behavior;
- first player reaching Finish wins.

See the canonical rules document for the complete table and card list.

## RulesRuntime boundary

Gameplay semantics are supplied through a versioned `RulesRuntime`:

- `rollDice()`;
- `calculateMovement()`;
- `getLandingEffects()`;
- `resolveDomainEffect()`;
- `evaluateVictory()`;
- optional `getNextPlayerId()`.

This keeps rendering, persistence, transport, and content-management infrastructure outside the rules core. Future rules variants can coexist by using new IDs/versions rather than altering an existing saved game's semantics.

## Command model

Supported engine commands are:

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
resolving
  -> optional awaiting_decision
  -> resolving
  -> awaiting_turn_end
  -> END_TURN (or automatic end policy)
  -> next awaiting_roll
```

Digital Rules v1 uses automatic turn end. Victory transitions atomically to `completed` and normal turn actions are no longer legal.

## Repository QA

From the repository root:

```bash
npm run qa
```
