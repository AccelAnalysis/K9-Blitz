# K9 Blitz Game Modes & Players

This package implements Workstream 5 from the project README: **Game Lobby, Local Multiplayer, Online Multiplayer, and Computer Players**.

## Design boundary

This package owns participant/session orchestration. It deliberately does **not** implement board movement, dice, card effects, turn progression, or victory rules. Those belong to the Rules / Turns / Game State and Core Mechanics workstreams.

Physical-game facts that are not yet supported by an authoritative rulebook remain configuration-driven rather than guessed:

- minimum and maximum player count;
- available pawn identifiers/colors;
- dog assignment behavior;
- turn-order behavior;
- private/public card visibility;
- Finish and victory behavior.

## What is implemented

### Lobby

- stable player seats;
- host/session authority separated from gameplay authority;
- configurable player limits;
- local, remote-human, and computer controller types;
- mutually exclusive pawn assignments;
- dog assignment hook;
- ready-state validation;
- minimum-player and all-ready start gate;
- explicit lobby lifecycle (`open -> starting -> closed`).

### Local pass-and-play

`LocalPassAndPlaySession` rotates active players by seat and emits a privacy-handoff requirement when the eventual rules/content model says private information exists.

### Online private multiplayer

`OnlineRoomSessionRegistry` provides transport-agnostic connection ownership and reconnection behavior:

- authenticated `userId` -> stable game `playerId` binding;
- connection/disconnection state;
- reconnect-token validation;
- reconnect credential rotation;
- no duplicate player creation during reconnect.

`createRoomCode` provides human-friendly room codes without ambiguous characters. A production room service must still enforce uniqueness against the authoritative store.

### Computer players

`ComputerController` receives only legal actions supplied by the rules engine, then selects the highest-scoring option. This makes AI another player controller rather than a second rules implementation and prevents the AI from bypassing legality.

### Rules-engine authorization bridge

`authorizePlayerCommand` checks:

1. game identity;
2. active-player ownership;
3. command legality supplied by the authoritative Rules/Turn engine.

Clients therefore send intent (for example `ROLL_DICE`), never authoritative outcomes such as dice values or final board positions.

## Integration shape

```text
Local UI / Remote UI / AI
          |
     PlayerController
          |
    CommandEnvelope
          |
 authorizePlayerCommand
          |
 Rules / Turn Engine
          |
 Authoritative Game State
```

The multiplayer transport and persistence implementation should wrap these domain objects instead of embedding game rules in websocket/UI handlers.

## Build and test

This package has no runtime dependencies.

```bash
cd packages/game-modes
npm run build
npm test
```

A root workspace can later absorb this package without changing its public TypeScript API.
