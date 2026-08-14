# K9 Blitz Game Modes & Players

This package implements Workstream 5: **Game Lobby, Local Multiplayer, Online Multiplayer, and Computer Players**.

## Authority boundary

Game Modes & Players owns **who is participating and how commands reach the game**. It does not own dice outcomes, board movement, card effects, turn order, or victory. `packages/game-engine` remains the sole authority for gameplay state transitions.

The subsystem follows the repository's engineering guardrails:

- clients/controllers submit intent rather than authoritative outcomes;
- command preflight is revision-aware and structurally matches the game-engine envelope (`commandId`, `actorPlayerId`, `expectedRevision`);
- the game engine must still validate every command before mutation;
- local pass-and-play receives the active/next player from the authoritative turn state instead of inventing turn order;
- computer players choose only from legal actions supplied by the authoritative layer;
- online clients accept newer full authoritative snapshots and ignore stale/duplicate snapshots;
- reconnect credentials are rotated and remote identities remain bound to stable game-player IDs.

## Unresolved physical-game facts

The available source material does not yet establish several physical-game rules. They remain configuration or explicit unresolved values rather than guessed constants:

- minimum and maximum player count;
- dog-assignment method;
- turn-order method;
- private/public card visibility;
- Finish and victory behavior.

Pawn inventory is also configuration-driven so the eventual authoritative component inventory can set the exact supported colors/count.

## Lobby

`createLobby`, `joinPlayer`, `assignPawn`, `assignDog`, `setPlayerReady`, `startGame`, and `closeLobbyForPlay` provide:

- stable numbered seats;
- separate host/session authority and gameplay authority;
- configurable player limits;
- local-human, remote-human, and computer controller types;
- mutually exclusive pawn assignment;
- ready-state and minimum-player start gates;
- authenticated identity requirements for online humans;
- one online user identity per player seat;
- explicit `open -> starting -> closed` lifecycle.

Closing the lobby marks participants as waiting. It intentionally does **not** choose the first player.

## Local pass-and-play

`LocalPassAndPlaySession` is a presentation/session helper for one-device games. The Rules/Turn engine supplies the initial active player and every next player. The helper only tracks device handoff and whether a privacy gate is required when private information exists.

## Online private multiplayer

`OnlineRoomSessionRegistry` is transport-independent. It supports:

- authenticated `userId -> playerId` binding;
- connected/disconnected session state;
- reconnect-token validation;
- reconnect credential rotation;
- preservation of the original game player across reconnects.

`OnlineStateCursor` accepts only newer full authoritative snapshots for the expected game. It permits revision gaps because snapshots are complete state, not event deltas.

`createRoomCode` produces human-friendly room locators without ambiguous characters. Random selection is injectable for deterministic tests. Room codes are locators, not gameplay randomness or administrative credentials; a production room repository must enforce uniqueness.

Network transport, persistent room storage, authentication-provider integration, and deployment topology remain adapters around this domain package and are not invented here.

## Computer players

`ComputerController` is a deterministic baseline controller. It cannot manufacture moves or inspect information outside the legal-action set it receives. It chooses the highest `scoreHint`; ties preserve authoritative legal-action order. More sophisticated AI can replace the scoring policy without becoming a second rules engine.

## Rules-engine integration

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

`preflightPlayerCommand` is defense-in-depth for a session/network boundary. A successful preflight is never permission to mutate state directly; the same command must still be executed by the game engine.

## Verification

The package uses the repository's Node 24 native-TypeScript conventions and root QA workflow. Tests cover lobby invariants, start gating, rules-driven local handoff, stale/wrong-player/illegal command rejection, reconnect identity, duplicate online identities, authoritative snapshot ordering, deterministic computer choice, and room-code random-source validation.

Run from the repository root:

```bash
npm run qa
```
