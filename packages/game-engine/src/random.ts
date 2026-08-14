export interface RandomSource {
  nextInt(minInclusive: number, maxInclusive: number): number;
}

export function assertRandomInt(
  value: number,
  minInclusive: number,
  maxInclusive: number,
): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Random source returned non-integer value: ${value}`);
  }

  if (value < minInclusive || value > maxInclusive) {
    throw new Error(
      `Random source returned ${value}; expected ${minInclusive}..${maxInclusive}`,
    );
  }

  return value;
}
