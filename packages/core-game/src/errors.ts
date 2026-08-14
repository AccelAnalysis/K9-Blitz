export class ComponentInvariantError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ComponentInvariantError";
    this.code = code;
  }
}

export function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ComponentInvariantError(
      "INVALID_POSITIVE_INTEGER",
      `${label} must be a positive integer; received ${value}.`,
    );
  }
}

export function assertUniqueIds(ids: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new ComponentInvariantError(
        "DUPLICATE_ID",
        `${label} contains duplicate id \"${id}\".`,
      );
    }
    seen.add(id);
  }
}
