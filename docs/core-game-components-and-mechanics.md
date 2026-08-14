# 2. Core Game Components & Mechanics

## Status

**Complete for K9 Blitz Digital Rules v1.0.**

- Rules authority: `docs/DIGITAL_RULES_V1.md`
- Runtime component catalog: `packages/core-game/src/baseGame.ts`
- Content version: `launch-1.0`
- Rules version: `k9-blitz-digital-1.0`
- Provenance: owner-authorized digital adaptation where legacy physical behavior was unavailable

The physical references establish the visible component families—two dice, Trainer Cards, dog profiles including Max and Luna, tokens/bag, named activity spaces, and the K9 Competition Track. The owner has authorized missing legacy details to be designed for the digital product. Those decisions are versioned as digital rules rather than presented as recovered physical-rule facts.

## 1. Dice System

The launch game uses one red d6 and one white d6. `STANDARD_K9_BLITZ_DICE` defines both. `rollDice()` receives an injected `RandomSource`, records individual values, and returns their total.

Digital Rules v1:

- rolls two d6;
- movement is the summed total, 2–12;
- doubles add no special behavior;
- board movement clamps at Finish; no exact roll is required.

The animation layer may display rolling dice, but authoritative results come from the game engine/random source rather than the animation.

## 2. Trainer Card System

The launch Trainer deck contains 12 owner-authorized cards in a fixed authored sequence:

1. Good Behavior! — +2 Paw Tokens
2. Quick Study — +1 Competition step
3. Zoomies! — move +2; do not resolve destination
4. Water Break — no state change
5. Treat Pouch — +1 Paw Token
6. Practice Pays — +2 Competition steps
7. Squirrel! — move -1; do not resolve destination
8. Second Chance — extra turn
9. Park Pals — +1 Paw Token and +1 Competition step
10. Freshly Groomed — +2 Paw Tokens
11. Trainer's Bonus — move +1 and +1 Paw Token; do not resolve destination
12. Calm & Focused — +1 Competition step

`createCyclicTrainerDeck()` and `drawCyclicTrainerCard()` model the exact v1 behavior: after card 12, the next draw returns to card 1. Generic shuffled/deck/discard primitives remain available for future rules versions.

Cards resolve immediately and are public; v1 does not maintain hidden hands.

## 3. Dog Profile Cards

The launch catalog contains:

- Max — Beagle;
- Luna — Corgi;
- Rookie — Training Dog;
- Ace — Competition Dog.

Under Digital Rules v1 dog choice is identity/presentation only and does not alter movement, rewards, dice, or victory. The `DogProgressState` API still supports immutable training and achievement progression for current presentation and future content.

## 4. Tokens & Token Bag

The canonical v1 resource is the **Paw Token**.

Core mechanics provide:

- token definitions separate from unique piece instances;
- deterministic shuffled bag construction;
- drawing without replacement;
- player inventory collection;
- validated spending;
- prevention of negative inventory.

The digital component inventory contains 24 Paw Token piece instances for bag/piece representation and testability. Digital Rules v1 tracks awarded Paw Tokens as counts; finite physical-piece supply does not limit an award.

## 5. Board Space Actions

`DIGITAL_BASE_BOARD_SPACES` defines mechanics for all 72 route positions so no launch-space behavior is left implicit in artwork.

The 20 named special positions include K9 Academy, Obedience Class, Trainer Card, Doggy Daycare, Agility Run, Vet Check, Pawsitive Park, Treat Stop, Training Challenge, Competition Zone, Trick Learned, and Finish. Other multiples of five use the launch Paw Bonus rule (+1 Paw Token); remaining spaces have no state-changing landing action.

Important resolver contracts include:

- `GAIN_PAW_TOKENS`;
- `SPEND_PAW_TOKENS`;
- `ADVANCE_COMPETITION`;
- `DRAW_TRAINER_CARD`;
- `FINISH_GAME`.

A landing space resolves exactly once. Trainer Card movement explicitly does not recursively resolve its destination.

## 6. K9 Competition Track

The launch track has eight sequential stages:

1. Paw Basics
2. Treat Manners
3. Care Routine
4. Dog Skills
5. Agility
6. Play & Recall
7. Show Ring
8. Champion

The generic competition API validates stage references and prerequisites. Completion of stage eight awards `achievement:k9-competition-complete` in component state. Digital Rules v1 caps progress at eight but does not require competition completion to win.

## 7. Component/Rules Boundary

Category 2 owns definitions and deterministic component operations. Category 3 remains the authority for legal commands, turn phases, game-state mutation, history/events, persistence, concurrency/revision checks, and victory declaration.

The intended flow is:

```text
player command
  -> Category 3 validates authority/phase/revision
  -> Category 2 component operation resolves
  -> Category 3 commits authoritative state + events
  -> UI/animation renders accepted result
```

This keeps component mechanics reusable in local play, computer play, online authoritative hosting, tests, and future presentation layers.

## 8. Quality Gate

Category 2 is included in repository QA. The repository-wide test discovery finds `packages/core-game/test/core-game.test.mjs`, detects its `/dist/` import, builds `packages/core-game`, and then executes the deterministic component suite as part of `npm test`.

The tests cover:

- deterministic two-die results and v1 doubles semantics;
- cyclic Trainer Card ordering/wraparound;
- idempotent dog training/achievement progress;
- token bag draws and inventory spending;
- complete 72-space mechanics overlay and named resolver mappings;
- sequential Competition prerequisites;
- catalog counts, rules/content version, and owner-authorized provenance.
