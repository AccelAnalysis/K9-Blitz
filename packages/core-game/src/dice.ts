import { assertPositiveInteger } from "./errors.js";
import { type RandomSource, mathRandomSource, randomIntInclusive } from "./random.js";

export interface DieDefinition {
  readonly id: string;
  readonly sides: number;
  readonly presentation?: {
    readonly color?: string;
    readonly assetId?: string;
  };
}

export interface DieRoll {
  readonly dieId: string;
  readonly value: number;
}

export interface DiceRoll {
  readonly dice: readonly DieRoll[];
  readonly total: number;
}

/**
 * The physical reference shows two standard six-sided dice, one red and one white.
 * Whether individual values, doubles, or the sum have additional rule meaning remains rulebook-driven.
 */
export const STANDARD_K9_BLITZ_DICE: readonly DieDefinition[] = [
  { id: "red-d6", sides: 6, presentation: { color: "red" } },
  { id: "white-d6", sides: 6, presentation: { color: "white" } },
];

export function rollDice(
  dice: readonly DieDefinition[],
  random: RandomSource = mathRandomSource,
): DiceRoll {
  const results = dice.map((die) => {
    assertPositiveInteger(die.sides, `Die ${die.id} sides`);
    return {
      dieId: die.id,
      value: randomIntInclusive(random, 1, die.sides),
    } satisfies DieRoll;
  });

  return {
    dice: results,
    total: results.reduce((sum, die) => sum + die.value, 0),
  };
}
