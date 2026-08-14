import { ComponentInvariantError } from "./errors.js";

export interface RandomSource {
  /** Return a value in the half-open interval [0, 1). */
  next(): number;
}

export const mathRandomSource: RandomSource = {
  next: () => Math.random(),
};

export function randomIntInclusive(
  random: RandomSource,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) || minimum > maximum) {
    throw new ComponentInvariantError(
      "INVALID_RANDOM_RANGE",
      `Random integer bounds must be integers with minimum <= maximum; received ${minimum}..${maximum}.`,
    );
  }

  const sample = random.next();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new ComponentInvariantError(
      "INVALID_RANDOM_SAMPLE",
      `RandomSource.next() must return a finite value in [0, 1); received ${sample}.`,
    );
  }

  return minimum + Math.floor(sample * (maximum - minimum + 1));
}

export function shuffle<T>(values: readonly T[], random: RandomSource): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIntInclusive(random, 0, index);
    const current = copy[index];
    const swap = copy[swapIndex];
    if (current === undefined || swap === undefined) {
      throw new ComponentInvariantError(
        "SHUFFLE_INDEX_OUT_OF_RANGE",
        "Shuffle selected an invalid array index.",
      );
    }
    copy[index] = swap;
    copy[swapIndex] = current;
  }
  return copy;
}
