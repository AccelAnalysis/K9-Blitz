# @k9-blitz/core-game

Category 2 implementation for **Core Game Components & Mechanics**.

This package digitizes the physical gameplay components that are currently supported by the project references while deliberately stopping short of inventing unavailable rulebook behavior.

## Implemented

- two-die component model and deterministic dice rolling;
- Trainer Card definitions, physical card instances, shuffled draw piles, draws, discards, and explicit discard recycling;
- Dog Profile definitions plus per-game training/achievement progress;
- finite token-bag instances, draws without replacement, token inventory collection/spending;
- data-driven board-space action definitions and trigger selection;
- configurable K9 Competition Track stages, prerequisites, requirements, and completion state;
- deterministic `RandomSource` injection for tests and future server-authoritative multiplayer;
- invariant errors for invalid mechanical state.

## Intentional boundaries

The package does **not** define the complete K9 Blitz rules engine, turn controller, board movement graph, UI, persistence, or multiplayer transport. Those belong to other project categories.

The supplied physical reference establishes the existence of two six-sided dice, Trainer Cards, Dog Profile Cards, tokens/token bag, named action spaces, and the K9 Competition Track. It does not establish the exact card effects, token meanings, dog attributes, doubles rules, space outcomes, competition requirements, discard recycling rules, or victory conditions. Those values remain content/rulebook inputs.

Notably, `recycleTrainerDiscardPile()` exists as an explicit primitive but is never called automatically. The future rules engine decides whether recycling is legal for a given rule version.

## Local verification

```bash
cd packages/core-game
npm install
npm test
```

The tests use injected deterministic random sources; they do not rely on statistical assertions.
