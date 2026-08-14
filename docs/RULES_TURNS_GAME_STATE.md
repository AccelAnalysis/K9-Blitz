# 3. Rules, Turns & Game State

## Status

**Implemented and supplied with an owner-authorized production ruleset.**

The framework-independent authoritative engine lives in `packages/game-engine`. The production digital rules adapter is:

- `packages/game-engine/src/digitalRulesV1.ts`
- ruleset: `k9-blitz-digital`
- rules version: `1.0.0`
- content version: `digital-base-1.0.0`

The complete gameplay specification is `docs/K9_BLITZ_DIGITAL_RULES_V1.md`.

## Scope

This workstream owns:

1. rules execution;
2. authoritative game state;
3. turn controller and legal-action gating;
4. semantic game history;
5. revision-aware concurrency;
6. rules/content version binding;
7. game-state invariants and atomic rejection of corrupt transitions;
8. the owner-authorized K9 Blitz Digital Rules v1 runtime.

The package imports no UI, browser, rendering, persistence, authentication, or multiplayer transport SDK.

## Governing principle

> The board shows what happened; the rules engine decides what happened; game state remembers what happened.

Clients submit commands. The engine validates the command against the exact authoritative snapshot, invokes the active versioned rules runtime, applies one transaction, validates resulting invariants, and returns state plus semantic events.

```text
client intent
  -> commandId + expectedRevision
  -> lifecycle/player/phase validation
  -> versioned RulesRuntime
  -> deterministic ordered effect resolution
  -> invariant validation
  -> GameState revision N+1
  -> semantic events stamped with revision N+1
```

## Authoritative game state

`GameState` records:

- game/rules/content version identity;
- monotonic revision;
- lifecycle status;
- turn order, current player, turn number, and round number;
- exact `TurnState` and turn phase;
- player positions, dog identity, cards/tokens, statuses, and extension data;
- dog runtime state;
- Trainer Card draw/discard state;
- Paw Token bag/discard/removed state;
- K9 Competition state;
- ordered pending rule effects;
- winner state;
- append-only semantic history;
- command receipts;
- event/effect sequence counters;
- timestamps.

State is JSON-serializable so save/reconnect restores the exact interrupted phase rather than approximating a turn from board position alone.

## Commands and concurrency

Supported control commands are:

- `START_GAME`
- `ROLL_DICE`
- `CHOOSE_OPTION`
- `END_TURN`
- `PAUSE_GAME`
- `RESUME_GAME`

Every command carries a unique `commandId`, actor player ID, and `expectedRevision`.

- stale revisions fail without mutation;
- duplicate command IDs fail without re-execution;
- accepted commands increment the revision exactly once;
- one command may emit multiple semantic events within the same committed revision.

This is the authoritative concurrency boundary for future online multiplayer.

## Turn state machine

```text
ready
  -> START_GAME
active / turn_start
  -> awaiting_roll
  -> resolving
       -> awaiting_decision (only when a rules effect needs input)
       -> resolving
  -> awaiting_turn_end
  -> turn_complete
  -> next turn_start
```

Digital Rules v1 uses automatic turn completion after mandatory effects resolve. `Second Chance` may cause the next player to be the same player exactly once.

The UI must derive legal actions from `getLegalActions(state, playerId)` rather than independently deciding what is permitted.

## Digital Rules v1 runtime

The concrete v1 adapter supplies behavior that the earlier architecture intentionally left open:

- 2–4 players;
- 72 spaces (`space-0` through `space-71`);
- two six-sided dice;
- movement by dice total with clamping at FINISH;
- no exact-roll or doubles special rule;
- named training/token/Vet/Trainer Card spaces;
- 48 Paw Token instances with spend/recycle behavior;
- K9 Competition progress capped at 8;
- 12 immediate-resolution Trainer Cards;
- random card draws without replacement and discard recycling;
- chained card movement and landing effects;
- single-use extra-turn markers;
- first player to reach `space-71` wins.

See `docs/K9_BLITZ_DIGITAL_RULES_V1.md` for the full rules.

## Provenance policy

The physical references establish visible components and theme but do not currently establish every underlying behavior. The game owner explicitly authorized original design/fabrication of missing rules.

Accordingly:

- source-observed physical facts remain labeled as such;
- missing semantics completed for v1 are labeled owner-authorized digital design;
- those digital rules are production-authoritative for the digital edition;
- they are not falsely represented as verbatim physical-rule transcription;
- any later owner-approved change receives a new rules/content version.

This replaces the former policy that missing physical rules had to remain unresolved.

## Rule-effect queue

Landing rules return ordered effects. The engine supports:

- `CHOICE` effects, which block until the designated player supplies a valid option;
- `DOMAIN` effects, which delegate domain mutation to the active rules runtime.

Domain effects may emit semantic events and enqueue follow-up effects. Follow-ups are placed in causal order, allowing Trainer Card movement to trigger the special space on which the pawn subsequently lands.

## Game history

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

Each event carries an ordered sequence and the committed game revision. Movement events preserve the logical path so the UI can animate each hop while animation remains irrelevant to rules correctness.

## Invariants

The engine validates both incoming and proposed post-command state. Invariants include:

- unique player IDs;
- turn order contains the game players exactly once;
- active game has one valid current player and active turn;
- turn owner equals `currentPlayerId`;
- pending decisions agree with pending effect state;
- winner lifecycle is internally consistent;
- a physical Trainer Card instance exists in at most one authoritative location;
- a physical Paw Token instance exists in at most one authoritative location;
- command receipts are unique;
- event sequence is strictly increasing;
- revision is a non-negative integer.

Trainer Cards in Digital Rules v1 resolve immediately and are normalized into the discard pile, rather than simultaneously remaining in a player's hand.

## Randomness

Authoritative randomness is injected through `RandomSource`.

- dice outcomes use the injected source;
- Paw Token draws use the injected source;
- Trainer Card draws use the injected source;
- random results are represented in semantic game history;
- deterministic sources support reproducible tests and bug reports;
- an online host must own the random source rather than accepting client-declared results.

## Save/reconnect and versions

Every game is bound to:

- ruleset ID;
- exact rules version;
- exact content version.

A mismatched runtime cannot silently mutate a saved game. Migration must be explicit.

This means a future Digital Rules v1.1 or a later source-transcribed physical ruleset can coexist with existing v1.0 saved games without changing their historical semantics.

## QA coverage

The rules/game-state suite covers:

- version-bound game creation;
- 2–4 player setup constraints and unique pawns;
- turn ownership/legal actions;
- stale-revision rejection;
- deterministic two-die movement;
- Paw Token awards;
- Trainer Card draw/discard/effect behavior;
- no-repeat deck draws;
- Second Chance extra turns;
- FINISH victory;
- blocking decisions and ordered follow-up effects;
- player/round advancement;
- duplicate-command protection;
- post-win lockout;
- pause/resume;
- card/token-location invariants;
- exact JSON restore;
- rules/content-version mismatch;
- corrupt adapter-state rejection;
- input snapshot immutability.

Run repository-wide verification with:

```bash
npm run qa
```
