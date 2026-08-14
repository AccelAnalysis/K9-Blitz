# K9 Blitz Digital Rules v1.0

## Authority and provenance

This document defines the **production-authoritative rules for the K9 Blitz digital edition**.

The available project references establish the K9 Blitz theme, Barkley Ville board, START/FINISH route, two six-sided dice, dog pawns, Trainer Cards, Dog Profile Cards, Paw-style tokens, named training/action locations, and the K9 Competition Track. Exact physical-rule semantics are not fully available in the repository.

The game owner has explicitly authorized completion of missing behavior. Therefore, where the physical source does not establish a rule, this document records an **owner-authorized digital design decision**. Those decisions are authoritative for the digital edition beginning with `k9-blitz-digital@1.0.0`, but are not represented as verbatim transcriptions of an unavailable physical rulebook.

## Version identity

- Ruleset ID: `k9-blitz-digital`
- Rules version: `1.0.0`
- Content version: `digital-base-1.0.0`
- Players: 2–4
- Track: 72 logical spaces, `space-0` through `space-71`
- START: `space-0`
- FINISH: `space-71`
- Dice: two standard six-sided dice
- Competition Track maximum: 8
- Paw Token starting bag: 48 concrete markers, with virtual replenishment if required
- Trainer Card deck: 12 immediate-resolution cards

## Objective

Be the first trainer to move a dog pawn to the **FINISH podium at `space-71`**.

The K9 Competition Track and Paw Tokens record how successfully each trainer develops their dog during the race. They do not gate victory in the base v1.0 rules. The winner record preserves final Competition progress, Paw Token count, and Trainer Cards drawn.

## Setup

1. Create a game with 2–4 trainers.
2. Each trainer has a unique player ID and chooses a unique pawn color/identity.
3. Each trainer may select a Dog Profile. Dog profiles are thematic identities in v1.0 and do not alter dice probabilities or movement.
4. Every pawn begins on `space-0` (START).
5. Every trainer begins with:
   - 0 Paw Tokens;
   - 0/8 Competition progress;
   - 0 Trainer Cards drawn.
6. Initialize the 48-marker Paw Token bag.
7. Initialize the 12-card Trainer deck.
8. Turn order is seat order; seat 1 begins.

## Turn sequence

A normal turn is automatic after the player rolls:

1. **Roll** two six-sided dice.
2. **Move** forward by the sum.
3. If movement would pass FINISH, stop at `space-71`; an exact roll is not required.
4. **Resolve the landing space** exactly once.
5. Resolve all resulting Trainer Card effects in deterministic causal order.
6. Card-driven movement changes pawn position but **does not trigger a second landing-space effect** during that card resolution.
7. Check for victory.
8. If no player has won, end the turn automatically and advance to the next trainer, unless a Second Chance card granted one immediate extra turn.

Doubles have no special rule in v1.0.

## Board-space rules

All unlisted non-FINISH spaces are ordinary Barkley Ville travel spaces, except that every fifth space (`index % 5 === 0`) awards 1 Paw Token unless a named special rule overrides it.

| Space | Digital v1.0 rule |
|---|---|
| 0 | START; no landing effect |
| 2 | K9 Academy — advance Competition +1 |
| 4 | Obedience Class — gain 1 Paw Token |
| 5 | Paw Bonus — gain 1 Paw Token |
| 9 | Trainer Card — draw and resolve 1 Trainer Card |
| 10 | Paw Bonus — gain 1 Paw Token |
| 14 | Doggy Daycare — gain 1 Paw Token |
| 15 | Agility Run — advance Competition +1 |
| 19 | Vet Check — spend 1 Paw Token if available |
| 20 | Obedience Class — gain 1 Paw Token |
| 22 | Trainer Card — draw and resolve 1 Trainer Card |
| 25 | Paw Bonus — gain 1 Paw Token |
| 28 | Pawsitive Park — gain 1 Paw Token |
| 30 | Paw Bonus — gain 1 Paw Token |
| 32 | Trainer Card — draw and resolve 1 Trainer Card |
| 35 | Paw Bonus — gain 1 Paw Token |
| 36 | Treat Stop — gain 2 Paw Tokens |
| 40 | Paw Bonus — gain 1 Paw Token |
| 42 | Trainer Card — draw and resolve 1 Trainer Card |
| 45 | Paw Bonus — gain 1 Paw Token |
| 48 | Training Challenge — advance Competition +1 |
| 50 | Paw Bonus — gain 1 Paw Token |
| 52 | Treat Stop — gain 2 Paw Tokens |
| 55 | Paw Bonus — gain 1 Paw Token |
| 56 | Competition Zone — advance Competition +1 |
| 58 | Vet Check — spend 1 Paw Token if available |
| 60 | Paw Bonus — gain 1 Paw Token |
| 62 | Trainer Card — draw and resolve 1 Trainer Card |
| 65 | Treat Stop — gain 2 Paw Tokens |
| 67 | Trick Learned — advance Competition +1 |
| 70 | Paw Bonus — gain 1 Paw Token |
| 71 | FINISH — immediately wins the game |

Normal dice movement triggers the destination space. Movement created by a Trainer Card does not trigger that destination's board-space action. This keeps every rolled landing to one board-space resolution and prevents recursive card/space chains.

## Paw Tokens

Paw Tokens are score/progress markers in Digital Rules v1.0.

- Digital state begins with 48 uniquely identified Paw Tokens to mirror the visible tabletop token supply.
- Awards draw unique token instances from the current bag.
- Vet Check spends up to 1 token; a trainer with zero tokens does not go negative.
- Spent tokens move to the token discard pool and may recycle into the bag.
- **An earned Paw Token award is never denied because all existing markers are held.** If the initial/recycled markers cannot satisfy an award, the digital engine creates additional unique virtual Paw Token instances.
- The browser edition may display this model simply as a token count; the authoritative engine preserves unique token identities for state integrity.

Paw Tokens are tracked for player achievement/history and final winner metadata in v1.0.

## K9 Competition Track

Competition progress is an integer from 0 through 8.

- Training, Agility, Competition, and selected Trainer Card effects advance progress.
- Progress cannot exceed 8.
- Progress never decreases in v1.0.
- Competition progress does not gate FINISH in the base rules.
- Reaching 8 represents a fully completed K9 Competition Track and remains visible as an achievement.

The display sequence is eight steps/icons: paw, bone, bowl, dog/training, agility, disc/play, dog, trophy.

## Trainer Cards

Trainer Cards resolve immediately, then move to the discard pile. They are not held for later use in v1.0. Draws are random without replacement from the current draw pile; when the draw pile is exhausted, the discard pile becomes the new draw pool.

| Card | Effect |
|---|---|
| Good Behavior! | Gain 2 Paw Tokens |
| Quick Study | Competition +1 |
| Zoomies! | Move forward 2 spaces; do not resolve the destination space |
| Water Break | No state change |
| Treat Pouch | Gain 1 Paw Token |
| Practice Pays | Competition +2 |
| Squirrel! | Move back 1 space; do not resolve the destination space |
| Second Chance | Take one immediate extra turn after the current turn |
| Park Pals | Gain 1 Paw Token and Competition +1 |
| Freshly Groomed | Gain 2 Paw Tokens |
| Trainer's Bonus | Move forward 1 space without resolving the destination, then gain 1 Paw Token |
| Calm & Focused | Competition +1 |

### Extra-turn rule

Second Chance grants **exactly one** extra turn. The marker is bound to the turn on which the card was resolved, so it cannot repeat indefinitely. If another Second Chance is legitimately drawn during the extra turn, that later card may grant another single extra turn.

## Victory

Victory is evaluated after normal movement and all mandatory landing/card effects have resolved.

A player wins immediately when their pawn is on `space-71`, including when a Trainer Card moves the pawn there.

The game then becomes `completed`; normal gameplay commands are rejected. The winner record includes:

- player ID;
- selected dog ID, if any;
- winning turn number;
- Competition progress;
- Paw Token count;
- number of Trainer Cards drawn.

Because turns are sequential and victory ends the game immediately, the base game has no simultaneous-winner state and requires no tie-breaker.

## Turn, concurrency, and save rules

The digital edition uses the shared authoritative game engine:

- every command includes an expected game revision;
- stale commands fail without mutation;
- duplicate command IDs cannot execute twice;
- all accepted actions increment the game revision atomically;
- random outcomes are supplied by an authoritative `RandomSource` and recorded in semantic history;
- save/resume restores the exact turn phase, deck state, token state, Competition state, history, and rules/content versions;
- a save created under a different rules or content version cannot silently continue under v1.0.

## Local, computer, and online play

These gameplay rules are mode-independent.

- Local/pass-and-play uses the same rules.
- Computer-controlled seats use the same dice/effect rules and receive no hidden advantage.
- Future online rooms must run this rules runtime on the authoritative host; clients submit commands rather than authoritative outcomes.

## Change control

Any balance or behavioral change after this document must receive a new rules/content version as appropriate. Existing saved games remain bound to the version under which they were created.

This document is the canonical design authority for **K9 Blitz Digital Rules v1.0** unless superseded by a later owner-approved version.
