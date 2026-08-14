# 3. Rules, Turns & Game State

## Status

**Implemented with the owner-authorized launch rules.**

This workstream lives in `packages/game-engine`. The generic authoritative engine is now paired with the concrete `digitalRulesV1.ts` runtime for the product authority in `docs/DIGITAL_RULES_V1.md`.

Canonical identity:

- rules/profile ID: `k9-blitz-digital-1.0`;
- engine `rulesVersion`: `k9-blitz-digital-1.0`;
- content version: `launch-1.0`.

Missing physical-rule semantics are no longer blockers: the owner-authorized Digital Rules v1 specification fills those gaps while preserving provenance as digital product design rather than recovered physical-rule evidence.

## Responsibilities

The game-engine layer owns:

1. authoritative rules execution;
2. authoritative JSON-serializable game state;
3. turn controller and legal-action gating;
4. semantic game history;
5. revision-aware concurrency;
6. exact rules/content version binding;
7. effect ordering;
8. state invariants and atomic rejection;
9. Digital Rules v1 movement, spaces, Trainer Cards, Paw Tokens, Competition progress, extra turns, and victory.

It imports no UI, rendering engine, browser API, persistence SDK, authentication SDK, or multiplayer transport.

## Governing flow

```text
player/controller intent
  -> typed command + commandId + expectedRevision
  -> lifecycle / player / phase validation
  -> Digital Rules v1 runtime
  -> movement + ordered effects
  -> invariant validation
  -> authoritative state revision N+1
  -> semantic events stamped with revision N+1
  -> UI / save / multiplayer synchronization
```

The board shows what happened; the rules engine decides what happened; game state remembers what happened.

## Authoritative state

`GameState` stores:

- game ID;
- ruleset ID, rules version, and content version;
- monotonic revision;
- game lifecycle;
- setup/turn order and current player;
- turn number and round number;
- exact active `TurnState`;
- each player's board space, dog identity, pawn identity, Paw Tokens, Competition progress, card draw count, statuses, and finish state;
- Trainer Card draw/discard state;
- token state;
- Competition state;
- extension data such as a one-turn Second Chance marker;
- pending effects;
- winner state;
- append-only semantic history;
- command receipts;
- event/effect sequence counters and timestamps.

The snapshot is JSON-serializable, allowing exact save/reconnect instead of reconstructing a game from presentation state.

## Commands and concurrency

Current engine commands are:

- `START_GAME`;
- `ROLL_DICE`;
- `CHOOSE_OPTION`;
- `END_TURN`;
- `PAUSE_GAME`;
- `RESUME_GAME`.

Every command includes `expectedRevision`. A stale command fails without mutation. A processed `commandId` cannot run a second time. Accepted commands increment the revision exactly once even if multiple semantic events are emitted.

These guarantees are the server-authoritative boundary for future online rooms.

## Turn controller — Digital Rules v1

Digital Rules v1 uses setup/seat order and automatic turn completion.

```text
TURN_STARTED / awaiting_roll
  -> ROLL_DICE
  -> DICE_ROLLED
  -> PAWN_MOVED
  -> SPACE_LANDED
  -> resolve space / Trainer Card effects
  -> evaluate Finish victory
  -> TURN_ENDED
  -> next trainer awaiting_roll
```

`Second Chance` overrides the normal next-player result exactly once for the turn in which it is granted.

The generic engine retains `awaiting_decision` and manual end-turn capability for future rules variants, but the v1 launch rules have no persistent hidden hand or normal strategic choice that requires them.

## Concrete Digital Rules v1 runtime

`packages/game-engine/src/digitalRulesV1.ts` implements the committed product rules:

- 2–4 trainers;
- Player 1 / Seat 1 starts;
- setup-order pawns red, blue, green, yellow;
- dog profiles are presentation identities in v1;
- 72 spaces: Start `space-0`, Finish `space-71`;
- two d6, move by their sum (2–12);
- movement clamps at Finish; exact roll not required;
- doubles have no bonus;
- normal roll resolves its destination space exactly once;
- Trainer Card movement does not resolve its destination space;
- named token/training/Vet/Trainer/Competition effects mirror `apps/web/game-data.js` and `docs/DIGITAL_RULES_V1.md`;
- Paw Token balances cannot go negative;
- Competition progress is 0–8 and does not gate victory;
- 12 public Trainer Cards resolve immediately in the committed cyclic order;
- exhausted Trainer draw pile recycles the discard pile in the same order;
- first trainer reaching Finish wins immediately.

## Trainer Card lifecycle

Digital Rules v1 has no persistent player hand. A Trainer Card:

1. is drawn from the front of the canonical draw pile;
2. increments the player's `cardsDrawn` count;
3. moves to discard state;
4. emits a public `TRAINER_CARD_DRAWN` domain event;
5. resolves its effects immediately;
6. remains out of player `cardIds`, preserving the one-location-per-card invariant.

When the draw pile is exhausted, discard becomes the next draw cycle without changing order.

## Space/effect resolution

Board landing produces `DOMAIN` effects such as:

- `GAIN_PAW_TOKENS`;
- `SPEND_PAW_TOKENS`;
- `ADVANCE_COMPETITION`;
- `DRAW_TRAINER_CARD`.

Trainer Cards may additionally produce:

- `MOVE_RELATIVE`;
- `GRANT_EXTRA_TURN`.

Effects resolve through the engine queue, so every accepted state mutation remains ordered, versioned, auditable, and invariant-checked. Card movement intentionally has no follow-up landing effect under v1.

## Paw Tokens

The browser displays Paw Tokens as a non-negative count. The authoritative state represents held markers with unique IDs so duplicate-location checks remain possible. Spent token IDs move to discard state and are reused before new IDs are created. There is no v1 token-supply exhaustion penalty because the canonical rules define Paw Tokens as a reward/spend resource, not a finite victory-limiting inventory.

## Competition state

Each player begins at 0. Training/agility/competition spaces and specified Trainer Cards increment progress up to 8. Progress is mirrored into `competition.participants` and player data. Reaching 8 is an achievement, not a Finish prerequisite.

## Victory

After mandatory movement/effects, `evaluateVictory()` checks for a pawn at `space-71`. The game transitions atomically to `completed`, normal gameplay commands become illegal, and winner metadata records player, dog, Competition progress, Paw Tokens, cards drawn, and winning turn.

## Game history

Core semantic events include:

- `GAME_STARTED`;
- `TURN_STARTED`;
- `DICE_ROLLED`;
- `PAWN_MOVED`;
- `SPACE_LANDED`;
- `RULE_EFFECT_APPLIED`;
- `DOMAIN_EVENT`;
- `TURN_ENDED`;
- `GAME_PAUSED`;
- `GAME_RESUMED`;
- `GAME_COMPLETED`.

Each event carries an ordered sequence and committed state revision. Logical movement includes the traversed path so animation can fail/recover without changing the rules result.

## Invariants

The engine validates incoming and proposed state. Current invariants include:

- unique player IDs;
- turn order contains each game player exactly once;
- active game has one valid current player and turn;
- turn owner equals `currentPlayerId`;
- pending decisions and pending effects agree;
- winner lifecycle is consistent;
- a card/token instance exists in at most one authoritative location;
- command receipts are unique;
- event sequence is strictly increasing;
- revision is a non-negative integer.

If runtime output violates an invariant, the command is rejected and the original authoritative snapshot remains unchanged.

## Randomness

Digital Rules v1 uses injected authoritative randomness for the two dice. The v1 Trainer Card deck is cyclic, not shuffled, so no card randomness is invoked. Any future version that introduces shuffling must use the engine `RandomSource` and update the digital rules/content authority.

## Versioning and save compatibility

A game is bound to exact `rulesset/rulesVersion/contentVersion` values. A mismatched runtime cannot silently mutate it. Browser saves similarly require the launch rules/content versions. Future changes must version explicitly rather than altering the meaning of an in-progress v1 game.

## QA coverage

In addition to the generic engine tests, Digital Rules v1 tests cover:

- canonical rules/content identity;
- 2–4 player setup and seat ordering;
- canonical pawn assignment;
- two-die movement and automatic turn advancement;
- Obedience/Paw Token resolution;
- Trainer Card immediate/cyclic lifecycle;
- deck recycling;
- card movement without destination-space resolution;
- Second Chance extra turn;
- Competition cap at 8;
- Vet Check with zero tokens;
- Finish clamping and first-to-Finish victory.

Run repository-wide verification with:

```bash
npm run qa
```
