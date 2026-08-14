# 2. Core Game Components & Mechanics

## Scope

This slice implements the digital domain primitives for the physical components named in Category 2 of the project README:

1. Dice System
2. Trainer Card System
3. Dog Profile Cards
4. Tokens & Token Bag
5. Board Space Actions
6. K9 Competition Track

The package is intentionally rules-engine-neutral. It provides deterministic operations and state transitions that Category 3 can authorize and compose.

## Component boundaries

### Dice

`rollDice()` accepts typed die definitions and an injectable `RandomSource`. `STANDARD_K9_BLITZ_DICE` reflects the observed red and white six-sided dice. The roll retains individual values and total; no doubles or movement special case is assumed.

### Trainer Cards

Card **definitions** are separated from physical card **instances**. This permits multiple physical copies of one definition while preserving unique runtime identities. Deck state owns only draw/discard locations; player hands or active cards belong to game state/rules orchestration.

Card effects are represented as resolver-neutral instructions (`effectId` plus parameters). Category 3 resolves them; Category 2 does not invent effect semantics.

### Dogs

Dog definitions hold content-facing profile information and arbitrary attributes/skills. `DogProgressState` holds runtime training and achievements separately, preventing source card content from being mutated during play.

### Tokens

The bag tracks unique physical token instances and draws without replacement. Player inventory is tracked by token definition ID and supports validated collection and spending. Returning tokens to the bag is not automated because the rulebook behavior is not yet established.

### Board-space actions

Board spaces reference action definitions by `resolverId`. This keeps the graphical board independent from rule execution. Triggers currently support `land`, `pass`, `turn-start`, and `turn-end` as structural hooks; the rules engine decides which hooks are actually used by authoritative K9 Blitz rules.

### Competition Track

Competition stages are content-defined with prerequisites, requirements, and reward IDs. The implementation validates references and completion eligibility but does not assume that the photographed icon sequence itself defines final rules.

## Integration contract with Category 3

Category 3 should consume these operations through commands/events rather than modifying component state ad hoc. Examples:

- authorize a dice roll, then call `rollDice()`;
- authorize a Trainer Card draw, then call `drawTrainerCard()`;
- translate a landed board space into `getTriggeredSpaceActions()` and execute referenced resolver IDs;
- satisfy configured competition requirements, then call `completeCompetitionStage()`;
- persist resulting component state inside the authoritative game state.

## Unknown-rule policy

Until the physical rulebook and complete component inventory are transcribed, authoritative gameplay content must not be inferred from the board photograph. In particular, this slice does not claim:

- special behavior for doubles or individual die values;
- the exact movement formula;
- any specific Trainer Card effect;
- meanings or values for photographed token icons;
- actual Dog Card attributes or special abilities;
- the consequence of Vet Check, Obedience Class, Agility Course, Treat Stop, or other spaces;
- the true K9 Competition Track requirements/rewards;
- exact finish/winner conditions.

The software seams are present so those rules can be loaded later without rewriting the component model.
