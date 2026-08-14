# @k9-blitz/core-game

Category 2 implementation for **Core Game Components & Mechanics**.

This package is the framework-independent component model for K9 Blitz Digital Rules v1.0. It distinguishes visible/source-backed physical-game concepts from owner-authorized digital product rules, then exposes typed, deterministic primitives for the rules engine and player interfaces.

## Authoritative launch catalog

`src/baseGame.ts` publishes the component catalog for:

- rules version `k9-blitz-digital-1.0`;
- content version `launch-1.0`;
- two standard six-sided dice (red and white);
- four launch dog profiles: Max, Luna, Rookie, and Ace;
- the 12-card Trainer deck in its authored cyclic order;
- Paw Token definition and digital piece inventory;
- the complete 72-space mechanics overlay, including named action spaces and Paw Bonus spaces;
- an eight-stage K9 Competition Track;
- launch movement, token, card, competition, and victory semantics.

The source-backed physical references establish the existence and theme of dice, Trainer Cards, dog profiles, tokens/bag, named action spaces, and the central Competition Track. Missing legacy behavior has been explicitly authorized by the owner as versioned digital product design. It is therefore authoritative for the digital edition, but is not labeled as a recovered verbatim physical rulebook.

## Component APIs

### Dice

`rollDice()` uses injected `RandomSource` values and preserves each die result plus the total. Digital Rules v1 uses the sum for movement and gives doubles no extra effect.

### Trainer Cards

Card definitions are separate from card instances. The package supports both shuffled finite decks and `createCyclicTrainerDeck()` / `drawCyclicTrainerCard()` for the v1 launch deck, which repeats its authored 12-card sequence.

### Dogs

Dog definitions and per-game progress are separate. Dog selection is presentation/identity only in Digital Rules v1; the progress primitives remain available for training and achievements without mutating source definitions.

### Tokens & token bag

Paw Tokens are the v1 reward/spend resource. Inventory helpers prevent overspending. The component inventory contains unique token instances and the bag API supports deterministic draw-without-replacement behavior; v1 awards are represented as counts, so finite piece supply does not constrain awards.

### Board-space actions

`DIGITAL_BASE_BOARD_SPACES` contains one mechanics record for every launch board index `0..71`. Resolver IDs keep mechanics independent from artwork and UI.

### K9 Competition Track

The catalog defines eight sequential stages and a completion achievement. Digital Rules v1 caps progress at eight and does not require Competition completion for victory.

## Integration contract

Category 3 remains responsible for command validation, authoritative turn/game state, event emission, persistence, and winner declaration. Category 2 supplies the definitions and deterministic component state transitions Category 3 composes.

Presentation code must never infer rules from artwork; it renders results accepted by the authoritative state/rules layer.

## Verification

From the repository root:

```bash
npm test
npm run qa
```

The Category 2 suite validates dice, cyclic cards, dog progress, tokens/bag, the 72-space mechanics overlay, Competition prerequisites, catalog counts, and version/provenance authority.
