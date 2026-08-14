import type { Clock, RandomSource } from "./contracts.ts";

export function assertRandomInt(
  value: number,
  minInclusive: number,
  maxInclusive: number,
): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Random source returned non-integer value: ${value}`);
  }
  if (value < minInclusive || value > maxInclusive) {
    throw new Error(`Random source returned ${value}; expected ${minInclusive}..${maxInclusive}`);
  }
  return value;
}

export class MathRandomSource implements RandomSource {
  nextInt(minInclusive: number, maxInclusive: number): number {
    if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
      throw new Error("Random bounds must be integers.");
    }
    if (maxInclusive < minInclusive) {
      throw new Error("Random maximum must be greater than or equal to minimum.");
    }
    return Math.floor(Math.random() * (maxInclusive - minInclusive + 1)) + minInclusive;
  }
}

/** Deterministic xorshift32 source for tests, replay fixtures, and reproducible bug reports. */
export class SeededRandomSource implements RandomSource {
  #state: number;

  constructor(seed: number) {
    this.#state = seed | 0;
    if (this.#state === 0) this.#state = 0x6d2b79f5;
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    if (!Number.isInteger(minInclusive) || !Number.isInteger(maxInclusive)) {
      throw new Error("Random bounds must be integers.");
    }
    if (maxInclusive < minInclusive) {
      throw new Error("Random maximum must be greater than or equal to minimum.");
    }

    let x = this.#state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.#state = x | 0;

    const normalized = (this.#state >>> 0) / 0x1_0000_0000;
    return Math.floor(normalized * (maxInclusive - minInclusive + 1)) + minInclusive;
  }
}

export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}
