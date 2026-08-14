# K9 Blitz Game Modes & Players

This package implements Workstream 5: **Game Lobby, Local Multiplayer, Online Multiplayer, Solo vs AI, and Computer Players**.

## Rule authority and provenance

The available game reference establishes the K9 Blitz/Barkley Ville theme, physical board, two dice, dog pawns, Trainer Cards, dog profiles including Max and Luna, tokens, named action spaces, and the K9 Competition Track. The project owner has explicitly authorized fabrication of missing details so the digital game can be complete.

Accordingly, this package now distinguishes two kinds of rule authority:

- **source-verified** — behavior/components directly supported by supplied physical-game materials;
- **owner-authorized digital** — synthesized behavior approved for the digital edition where the available materials do not provide an exact rule.

Owner-authorized rules are versioned and tested; they are not represented as verbatim transcriptions of an unavailable physical rulebook.

## Canonical player rules — v1.0

`K9_BLITZ_PLAYER_RULES_V1` is the canonical player/mode profile for the current digital edition:

- **2–5 total players**;
- five pawn identities: **red, blue, green, yellow, brown**;
- each trainer chooses a dog;
- **dogs are unique within a game**;
- **Seat 1 starts**;
- turns proceed in ascending seat order and wrap back to Seat 1;
- Trainer Cards are **public information** in the base digital rules;
- the **first trainer to reach Finish wins**;
- spectators and late joins are not part of v1;
- configuration is tagged `owner_authorized_digital` and `k9-blitz-player-rules-1.0`.

`createK9BlitzGameConfiguration(mode, contentVersion)` produces the canonical configuration instead of requiring callers to invent player limits or pawn inventory.

## Modes

### Local pass-and-play

- 2–5 total players;
- Seat 1 must be a local human host;
- later seats may be local humans or computer players;
- no accounts are required;
- the shared device presents the authoritative active player supplied by the turn engine.

### Solo vs AI

- one local human in Seat 1;
- 1–4 computer opponents;
- no second human seat is permitted in this mode;
- the human begins because Seat 1 starts under Digital Rules v1.0.

### Online private

- 2–5 total players;
- host must be an authenticated remote human;
- later seats may be authenticated remote humans or computer players;
- one online identity may occupy only one player seat;
- reconnect preserves the original `playerId` and rotates reconnect credentials;
- the domain layer is transport-independent and remains compatible with a future deployed authoritative multiplayer host.

The GitHub Pages build currently exposes Local/Solo play. The online domain contracts are implemented, but true cross-device rooms still require a deployed server-backed authoritative host; the static Pages client does not pretend otherwise.

## Lobby

`createLobby`, `joinPlayer`, `assignPawn`, `assignDog`, `setPlayerReady`, `startGame`, and `closeLobbyForPlay` provide:

- stable numbered seats;
- separate host/session authority and gameplay authority;
- canonical 2–5 player limits through the v1 profile;
- mode-specific controller validation;
- mutually exclusive pawn assignment;
- mutually exclusive dog assignment under the canonical profile;
- ready-state and minimum-player start gates;
- authenticated identity requirements for online humans;
- one online user identity per player seat;
- explicit `open -> starting -> closed` lifecycle.

## Turn-order integration

Game Modes defines the owner-authorized policy—Seat 1 first, then seat order—but the **authoritative game engine still stores and advances the active player**. `getSeatOrderedPlayerIds` and `getStartingPlayerId` resolve the policy for engine initialization without allowing UI/session code to mutate gameplay state directly.

## Local pass-and-play privacy

`LocalPassAndPlaySession` remains capable of enforcing a privacy handoff for future content. Under Digital Rules v1.0, Trainer Cards are public, so the base game does not require a private-device handoff between turns.

## Online synchronization

`OnlineRoomSessionRegistry` supports:

- authenticated `userId -> playerId` binding;
- connection/disconnection state;
- reconnect-token validation and rotation;
- preservation of the original player identity.

`OnlineStateCursor` accepts only newer authoritative snapshots for the expected game and rejects wrong-game state.

`createRoomCode` provides human-friendly room locators. Room codes are locators, not gameplay randomness or administrative credentials; a deployed room repository must still enforce uniqueness.

## Computer players

`ComputerController` cannot manufacture a move or bypass the rules engine. It receives only authoritative legal actions and selects the highest `scoreHint`; ties preserve authoritative legal-action order. This keeps AI as a controller, not a second rules implementation.

## Rules-engine boundary

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

`preflightPlayerCommand` remains defense-in-depth. Successful preflight never authorizes direct state mutation; the authoritative game engine must execute and validate the command.

## Verification

The repository uses Node 24 native TypeScript and root QA. Game Modes tests cover:

- the owner-authorized v1 profile;
- five-player seat capacity;
- Seat 1 starting order;
- unique pawns and dogs;
- Solo vs AI roster enforcement;
- minimum-player/readiness gates;
- public-card local handoff behavior;
- stale/wrong-player/illegal command rejection;
- online identity/reconnect behavior;
- authoritative snapshot ordering;
- deterministic computer-player choice;
- room-code random-source validation.

Run from the repository root:

```bash
npm run qa
```
