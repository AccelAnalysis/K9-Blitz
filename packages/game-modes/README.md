# K9 Blitz Game Modes & Players

This package implements Workstream 5: **Game Lobby, Local Multiplayer, Online Multiplayer contracts, Solo vs AI contracts, and Computer Players**.

## Product authority

The current digital gameplay authority is [`docs/DIGITAL_RULES_V1.md`](../../docs/DIGITAL_RULES_V1.md): **K9 Blitz Digital Rules v1.0** (`k9-blitz-digital-1.0`, content `launch-1.0`). It is an owner-authorized digital ruleset that intentionally fills gaps not recoverable from the available physical-game references.

Game Modes & Players now mirrors that authority instead of carrying unresolved placeholders.

`K9_BLITZ_DIGITAL_RULES_V1_PLAYER_PROFILE` captures the player-facing portion of Digital Rules v1:

- **2–4 trainer seats**;
- setup-order pawn assignment: **red, blue, green, yellow**;
- each trainer chooses a dog profile;
- dog profiles are identity/presentation choices and may repeat;
- **Player 1 / Seat 1 starts**;
- turns proceed in setup/seat order;
- Trainer Cards resolve immediately and are **public**, so v1 has no persistent hidden player information;
- the first trainer to reach **Finish** wins;
- computer-controlled seats follow the same rules as human seats;
- the only launch-supported mode in v1.0 is **local pass-and-play with optional computer seats**.

`createK9BlitzGameConfiguration(mode, contentVersion)` produces a versioned configuration using these canonical player limits and rule metadata. If a caller tags a configuration with `k9-blitz-digital-1.0` but changes the player count, pawn inventory, dog policy, turn order, card visibility, or victory contract, lobby creation rejects the drift instead of silently creating a different ruleset under the same version ID.

## Authority boundary

Game Modes owns **who participates, how seats/controllers are represented, how a session is joined/rejoined, and how player intent reaches the authoritative game engine**.

It does not directly mutate dice, movement, board-space effects, Trainer Cards, tokens, Competition progress, or victory state. Those remain authoritative game-engine responsibilities.

```text
Local UI / Remote UI / Computer Controller
                  |
           player command intent
                  |
        revision-aware preflight
                  |
                  v
        authoritative game engine
                  |
             state/events
                  |
      presentation / synchronization
```

## Local pass-and-play — launch mode

Digital Rules v1 supports 2–4 setup-order seats on one device.

- seats may be human or computer controlled;
- no remote-human controller is permitted;
- setup order is preserved as stable seat order;
- Player 1 starts;
- local handoff follows the active/next player supplied by authoritative turn state;
- because v1 Trainer Cards resolve publicly and there is no private hand, the base local game needs no privacy gate between turns.

## Computer players

`ComputerController` remains a normal player controller, not a second rules engine.

- it receives only legal actions supplied by the authoritative layer;
- it cannot manufacture movement, dice results, or hidden information;
- highest `scoreHint` wins;
- ties preserve authoritative legal-action order;
- under the current launch rules, normal turns have no strategic choice, so the computer simply performs the legal roll and resulting resolution.

## Solo vs AI contract

The package keeps a `solo_vs_ai` mode contract for product expansion. It is **not listed as a separate launch mode in Digital Rules v1**, because the current launch already permits computer-controlled seats inside local pass-and-play.

For explicit Solo vs AI sessions, the mode layer enforces:

- one local human host in Seat 1;
- 1–3 computer opponents within the v1 2–4 seat limit;
- no remote-human seats.

This reuses the same Digital Rules v1 player count, pawn inventory, turn order, public-information model, and victory contract.

## Online private contract

`online_private` is also a domain capability rather than a v1 launch mode. It remains ready for a deployed authoritative multiplayer host.

The mode layer provides:

- remote-human authentication requirement;
- stable `userId -> playerId` ownership;
- one remote identity per seat;
- connection/disconnection state;
- reconnect-token validation and rotation;
- full authoritative snapshot ordering through `OnlineStateCursor`;
- human-friendly room-code generation.

The static GitHub Pages client does **not** claim cross-device online play. A deployed room repository/transport still must provide authoritative persistence, room-code uniqueness, authentication integration, and server execution.

## Lobby lifecycle

`createLobby`, `joinPlayer`, `assignPawn`, `assignDog`, `setPlayerReady`, `startGame`, and `closeLobbyForPlay` provide:

- stable numbered seats;
- separate lobby-host authority from gameplay authority;
- Digital Rules v1 2–4 player limits;
- unique pawn assignment;
- player-chosen dog profiles;
- ready-state/minimum-player gates;
- mode-specific controller validation;
- authenticated online identity enforcement;
- explicit `open -> starting -> closed` lifecycle.

## Turn-order integration

Digital Rules v1 says turn order is setup order and Player 1 goes first. Player seats are created in setup order, so:

- `getSeatOrderedPlayerIds(players)` returns authoritative initialization order;
- `getStartingPlayerId(players)` resolves Player 1 / Seat 1;
- the game engine still stores and advances the active player after initialization.

The mode layer therefore expresses the rule without becoming the turn-state authority.

## Revision-aware command boundary

`preflightPlayerCommand` checks the session boundary before an intent reaches the engine:

1. game identity;
2. expected revision;
3. active-player ownership;
4. legal command type.

A successful preflight never authorizes direct state mutation. The authoritative game engine must validate and execute the command again.

## Verification

Game Modes tests now cover:

- exact parity with the committed Digital Rules v1 player profile;
- rejection of versioned configuration drift;
- four-seat setup order and Player 1 start;
- unique pawns and repeatable dog profiles;
- Solo vs AI roster constraints;
- readiness/minimum-player gates;
- public-information pass-and-play handoff;
- stale/wrong-player/illegal command rejection;
- online authentication/reconnect identity;
- authoritative snapshot ordering;
- deterministic computer-controller choice;
- room-code random-source validation.

Run the repository QA suite from the root:

```bash
npm run qa
```
