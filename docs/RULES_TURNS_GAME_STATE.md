# 3. Rules, Turns & Game State

## Scope

This workstream is implemented in `packages/game-engine`. It is the authoritative gameplay-control layer for K9 Blitz and owns:

1. complete rules-execution framework;
2. authoritative game state;
3. turn controller and legal-action gating;
4. semantic game history;
5. revision-aware concurrency;
6. rules/content version binding;
7. game-state invariants and atomic rejection of corrupt transitions.

The package is framework-independent and imports no UI, browser, rendering, persistence, authentication, or multiplayer transport SDK.

## Governing principle

> The board shows what happened; the rules engine decides what happened; game state remembers what happened.

Clients submit commands. The engine validates the command against the exact authoritative snapshot, invokes the active versioned rules runtime, applies one transition, validates resulting invariants, and returns state plus semantic events.

```text
client intent
  -> command envelope (commandId + expectedRevision)
  -> lifecycle / player / phase validation
  -> versioned RulesRuntime
  -> ordered effect resolution
  -> invariant validation
  -> authoritative GameState revision N+1
  -> GameEvents stamped with revision N+1
```

## Authoritative GameState

The snapshot records:

- `gameId`;
- `rulesetId`, `rulesVersion`, `contentVersion`;
- monotonic `revision`;
- lifecycle status;
- turn order, current player, turn number, and round number;
- exact active `TurnState`;
- player board position, dog, card/token inventory, statuses, completion data;
- dog runtime state;
- card deck draw/discard state;
- token bag/discard/removed state;
- competition runtime state;
- extension data for versioned domain mechanics;
- ordered pending effects;
- winner state;
- append-only semantic history;
- command receipts;
- event/effect sequence counters;
- timestamps.

The state is JSON-serializable so persistence and reconnect restore the exact interrupted phase, including a pending decision.

## Revision-aware commands

Every command carries `expectedRevision`. The engine rejects a command if its revision is not the current authoritative revision. Accepted commands increment the revision exactly once regardless of how many events they emit.

A previously processed `commandId` is also rejected without mutation, preventing retries/double-clicks from rolling, moving, resolving a choice, or ending a turn twice.

This is the concurrency boundary for future online multiplayer: clients may be stale; the engine may not be.

## Version binding

Every game is created against all three identifiers:

- ruleset ID;
- exact rules version;
- exact content version.

A runtime with a different rules or content version cannot mutate the saved game. Migration, if ever needed, must be explicit rather than silently applying newer rules midway through a game.

## Turn state machine

Core phases:

```text
turn_start
  -> awaiting_roll
  -> resolving
       -> awaiting_decision (when a rule requires player input)
       -> resolving
  -> awaiting_turn_end
  -> turn_complete
  -> next turn_start
```

The UI should call `getLegalActions(state, playerId)` and render those actions. It must not independently decide that a player may roll, choose, or end a turn.

Turn end can be configured as manual or automatic by the active rules runtime. Pending mandatory effects always block completion.

## Commands

Current control commands:

- `START_GAME`
- `ROLL_DICE`
- `CHOOSE_OPTION`
- `END_TURN`
- `PAUSE_GAME`
- `RESUME_GAME`

The command expresses intent, not outcome. For online play a client submits `ROLL_DICE`; it never submits an authoritative total, destination, token award, card result, or winner assertion.

## RulesRuntime integration seam

Because the physical rulebook is not yet in the repository, undocumented rules remain unresolved. The engine exposes a versioned adapter rather than guessing them:

```ts
interface RulesRuntime {
  metadata;
  startSpaceId;
  turnPolicy;
  rollDice(random);
  calculateMovement(state, playerId, dice);
  getLandingEffects(state, playerId, spaceId);
  resolveDomainEffect(domain, effect, context);
  evaluateVictory(state);
  getNextPlayerId?(state, currentPlayerId);
}
```

This lets the current parallel workstreams integrate cleanly:

- Board/Map defines authoritative board topology/path traversal.
- Core Game Components supplies deterministic dice/card/dog/token/space/competition primitives.
- Rules/Turns/Game State authorizes, orders, commits, versions, and records those mechanics.
- UI consumes state/events/legal actions.
- Online multiplayer runs the same engine behind the authoritative server boundary.

## Rule-effect queue

Landing rules return ordered effects. Two engine-level envelopes exist:

- `CHOICE`: blocks the turn and exposes only the configured options to the target player;
- `DOMAIN`: delegates actual component mutation to the rules runtime.

A domain resolution may emit semantic domain events and enqueue follow-up effects. Follow-ups execute before later queued effects, preserving deterministic causal order.

## Event history

Core event types include:

- `GAME_STARTED`
- `TURN_STARTED`
- `DICE_ROLLED`
- `PAWN_MOVED`
- `SPACE_LANDED`
- `RULE_EFFECT_APPLIED`
- `DECISION_REQUESTED`
- `DECISION_RESOLVED`
- `DOMAIN_EVENT`
- `TURN_ENDED`
- `GAME_PAUSED`
- `GAME_RESUMED`
- `GAME_COMPLETED`

Each event carries an event sequence and committed state revision. `PAWN_MOVED` stores the full logical path, so presentation can animate each hop while game correctness remains independent of animation success.

## Invariants

The engine validates the incoming snapshot and the proposed post-command snapshot. Current invariants include:

- unique player IDs;
- turn order contains exactly the game players;
- active game has one valid current player and active turn;
- turn owner equals `currentPlayerId`;
- waiting decisions agree with pending effect state;
- winner state exists exactly when the game is completed;
- a physical card instance exists in at most one authoritative location;
- a physical token instance exists in at most one authoritative location;
- command receipts are unique;
- event sequence is strictly increasing and matches `eventSequence`;
- revision is a non-negative integer.

If an adapter would violate an invariant, the command is rejected and the original input snapshot is returned unchanged.

## Randomness

Randomness is injected through `RandomSource`; authoritative random outcomes are included in semantic events. `SeededRandomSource` supports deterministic fixtures/replays and reproducible bug reports. Production online play should inject a server-owned unpredictable source rather than client randomness.

## Physical-rule dependency

The execution framework is implemented, but final K9 Blitz rule semantics remain **unverified** until authoritative source material is added for:

- player count/setup and starting-player determination;
- exact dice usage/special combinations;
- movement topology and Finish behavior;
- every board-space action;
- Trainer Card draw/hold/discard/effect rules;
- token meanings, acquisition, spending, and return behavior;
- Dog Card attributes/abilities/training progression;
- K9 Competition Track eligibility/progression/rewards;
- extra/skip-turn behavior;
- victory and tie-break conditions.

Those facts must be encoded in a source-backed `RulesRuntime`, not inferred from the board photograph.

## QA coverage

The engine tests cover positive, negative, edge, and persistence/concurrency paths including:

- serializable version-bound game creation;
- start/turn ownership/legal actions;
- stale-revision rejection;
- wrong-player rejection;
- deterministic dice/movement/history;
- blocking decisions and ordered follow-up effects;
- player/round advancement;
- duplicate-command protection;
- atomic victory and post-win lockout;
- pause/resume;
- duplicate card/token-location invariants;
- JSON restore at the exact turn phase;
- rules-version mismatch;
- content-version mismatch;
- corrupt adapter-state rejection;
- input snapshot immutability.

Run repository-wide verification with:

```bash
npm run qa
```
