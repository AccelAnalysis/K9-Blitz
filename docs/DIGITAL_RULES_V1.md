# K9 Blitz Digital Rules v1.0

## Status

**Product authority:** owner-authorized digital ruleset for the official K9 Blitz digital game.

This ruleset fills gameplay gaps that were not recoverable from the available physical-game references. Those decisions are intentional product design decisions, not claims that undocumented legacy physical rules were reconstructed. Once committed and versioned, these rules are authoritative for the digital edition until superseded by a later rules version.

- Rules ID: `k9-blitz-digital-1.0`
- Content ID: `launch-1.0`
- Supported launch mode: local pass-and-play, with optional computer-controlled seats
- Players: 2–4
- Board route: 72 spaces indexed 0–71, with Start at 0 and Finish at 71

## Objective

Be the first trainer to guide your dog from **Start** through Barkley Ville to the **Finish** podium.

Paw Tokens, Trainer Cards, and the K9 Competition Track improve the journey and are recorded in the final result, but reaching Finish is the victory condition in v1.0.

## Setup

1. Choose 2–4 trainer seats.
2. Enter a trainer name for each seat.
3. Each seat receives a unique pawn color in setup order: red, blue, green, then yellow.
4. Each trainer chooses a dog profile.
5. A seat may be controlled by a human or the built-in computer player.
6. All pawns begin on Start with 0 Paw Tokens, 0 Competition progress, and 0 Trainer Cards drawn.
7. Turn order is the setup order. Player 1 takes the first turn.

Dog profiles are identity/presentation choices in v1.0; they do not modify dice, movement, rewards, or victory.

## Turn sequence

A normal turn is:

1. **Roll** two six-sided dice.
2. **Move** forward by the sum of both dice.
3. If the roll would move beyond Finish, stop on Finish; an exact roll is not required.
4. If the pawn reaches Finish, the game ends immediately and that trainer wins.
5. Otherwise, **resolve the space landed on exactly once**.
6. Apply any resulting Paw Token, Competition, Vet Check, or Trainer Card effect.
7. If a Trainer Card moves a pawn, that card movement does **not** trigger the destination space. This prevents recursive/cascading landing effects.
8. If an effect grants an extra turn, the same trainer begins another turn after the current resolution completes.
9. Otherwise play passes to the next trainer. When play returns to Player 1, the round number increases.

## Dice

- Roll two standard six-sided dice.
- Movement equals `die 1 + die 2`, for a range of 2–12 spaces.
- Doubles have no additional effect in v1.0.
- Only one roll is allowed for a normal turn unless an effect explicitly grants another turn.

## Board spaces

The v1.0 route uses the board-space data in `apps/web/game-data.js`.

### Normal Barkley Ville space

No state change. Continue to the next trainer after the landing is acknowledged.

### Paw Bonus

Collect **1 Paw Token**.

### K9 Academy / training challenge

Advance **1 K9 Competition step** unless the named space explicitly awards a Paw Token instead.

### Obedience Class

Collect **1 Paw Token**.

### Doggy Daycare

Collect **1 Paw Token**.

### Agility Run / Agility Course

Advance **1 K9 Competition step**.

### Treat Stop

Collect **2 Paw Tokens**.

### Vet Check

Spend **1 Paw Token** if the trainer has one. Paw Tokens can never become negative. If the trainer has no Paw Tokens, the check is completed with no inventory change.

### Trainer Card

Draw and resolve the next Trainer Card from the digital deck.

### Competition Zone / Trick Learned / Training Challenge

Advance **1 K9 Competition step**.

### Finish

The first trainer to reach Finish wins immediately.

## Paw Tokens

Paw Tokens are the v1.0 reward/spend resource.

- Tokens are collected from spaces and Trainer Cards.
- Vet Check can remove one token.
- Token inventory cannot go below zero.
- Tokens are shown in the dashboard and winner summary.
- Tokens do not need to be spent to reach Finish and do not independently determine the winner.

## K9 Competition Track

Each trainer has an individual Competition Track with **8 steps**.

- Training, agility, competition spaces, and certain Trainer Cards advance progress.
- Progress cannot exceed 8.
- Reaching 8 represents a completed K9 Competition Track achievement.
- Competition completion is celebrated and displayed, but is not required to win v1.0.
- Final Competition progress is included in the winner/results presentation.

## Trainer Cards

The launch deck contains 12 cards. Cards resolve immediately when drawn.

| Card | Effect |
| --- | --- |
| Good Behavior! | +2 Paw Tokens |
| Quick Study | +1 Competition step |
| Zoomies! | Move ahead 2 spaces; do not resolve destination space |
| Water Break | No state change |
| Treat Pouch | +1 Paw Token |
| Practice Pays | +2 Competition steps |
| Squirrel! | Move back 1 space; do not resolve destination space |
| Second Chance | Take another turn after this one |
| Park Pals | +1 Paw Token and +1 Competition step |
| Freshly Groomed | +2 Paw Tokens |
| Trainer's Bonus | Move ahead 1 space and +1 Paw Token; do not resolve destination space |
| Calm & Focused | +1 Competition step |

The launch app advances through this versioned deck cyclically. A future rules/content version may introduce authoritative shuffle state without changing the player-interface contract.

## Computer players

A computer-controlled seat follows the same rules as a human seat. In the v1.0 launch game there are no strategic choices during a normal turn, so the computer automatically performs the legal roll and resolves resulting effects.

## Hidden information

K9 Blitz Digital Rules v1.0 contains no persistent private hand or hidden player information. Trainer Cards resolve when drawn instead of being held secretly. This keeps local pass-and-play frictionless.

## Save and resume

The browser release stores the complete local match snapshot together with `rulesVersion` and `contentVersion`.

A saved game may resume only when both versions match the running release. A rules/content version change intentionally invalidates incompatible older snapshots instead of silently applying new semantics to an in-progress game.

## Presentation authority boundary

The UI may animate dice, pawns, cards, tokens, audio, and celebrations, but presentation does not determine gameplay correctness.

Authoritative gameplay remains:

```text
player intent
  -> validate action
  -> compute rules result
  -> update state/version
  -> render/animate the accepted result
```

The digital rules may be extended by future owner-approved rules versions, but each change must be explicit, versioned, and tested.