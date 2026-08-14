# K9 Blitz Game Engine

`packages/game-engine` is the framework-independent authority for K9 Blitz rules execution, turns, game state, and game history.

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
- exact rules + content version compatibility checks for saved games and reconnects.

## Deliberate boundary

The physical rulebook and complete component inventory are not yet in the repository. The engine therefore does **not** invent exact K9 Blitz movement, doubles behavior, Trainer Card effects, token meanings, Dog Card abilities, board-space outcomes, Competition Track requirements, Finish requirements, or victory conditions.

Those authoritative behaviors are supplied by a versioned `RulesRuntime` through:

- `rollDice()`;
- `calculateMovement()`;
- `getLandingEffects()`;
- `resolveDomainEffect()`;
- `evaluateVictory()`;
- optional `getNextPlayerId()`.

Category 2 (`packages/core-game`) supplies deterministic physical-component primitives. A future source-backed K9 Blitz rules runtime composes those primitives through this interface; clients never mutate them directly.

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

Victory transitions atomically to `completed` and normal turn actions are no longer legal.

## Repository QA

From the repository root:

```bash
npm run qa
```
