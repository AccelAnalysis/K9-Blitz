import { ComponentInvariantError, assertPositiveInteger, assertUniqueIds } from "./errors.js";
import { type RandomSource, mathRandomSource, shuffle } from "./random.js";

export interface TokenDefinition {
  readonly id: string;
  readonly label: string;
  readonly iconAssetId?: string;
  readonly tags?: readonly string[];
}

export interface TokenInstance {
  readonly instanceId: string;
  readonly definitionId: string;
}

export interface TokenBagState {
  readonly remainingInstanceIds: readonly string[];
  readonly drawnInstanceIds: readonly string[];
}

export interface TokenDrawResult {
  readonly tokenInstanceId: string;
  readonly state: TokenBagState;
}

export type TokenInventory = Readonly<Record<string, number>>;

export function createTokenBag(
  instances: readonly TokenInstance[],
  random: RandomSource = mathRandomSource,
): TokenBagState {
  assertUniqueIds(
    instances.map((token) => token.instanceId),
    "Token bag",
  );

  return {
    remainingInstanceIds: shuffle(
      instances.map((token) => token.instanceId),
      random,
    ),
    drawnInstanceIds: [],
  };
}

export function drawToken(state: TokenBagState): TokenDrawResult {
  const [tokenInstanceId, ...remaining] = state.remainingInstanceIds;
  if (tokenInstanceId === undefined) {
    throw new ComponentInvariantError("TOKEN_BAG_EMPTY", "The token bag is empty.");
  }

  return {
    tokenInstanceId,
    state: {
      remainingInstanceIds: remaining,
      drawnInstanceIds: [...state.drawnInstanceIds, tokenInstanceId],
    },
  };
}

export function collectTokens(
  inventory: TokenInventory,
  tokenDefinitionId: string,
  amount = 1,
): TokenInventory {
  assertPositiveInteger(amount, "Token collection amount");
  return {
    ...inventory,
    [tokenDefinitionId]: (inventory[tokenDefinitionId] ?? 0) + amount,
  };
}

export function canSpendTokens(
  inventory: TokenInventory,
  tokenDefinitionId: string,
  amount = 1,
): boolean {
  assertPositiveInteger(amount, "Token spend amount");
  return (inventory[tokenDefinitionId] ?? 0) >= amount;
}

export function spendTokens(
  inventory: TokenInventory,
  tokenDefinitionId: string,
  amount = 1,
): TokenInventory {
  if (!canSpendTokens(inventory, tokenDefinitionId, amount)) {
    throw new ComponentInvariantError(
      "INSUFFICIENT_TOKENS",
      `Cannot spend ${amount} of token ${tokenDefinitionId}; only ${inventory[tokenDefinitionId] ?? 0} available.`,
    );
  }

  const remaining = (inventory[tokenDefinitionId] ?? 0) - amount;
  const next = { ...inventory } as Record<string, number>;
  if (remaining === 0) {
    delete next[tokenDefinitionId];
  } else {
    next[tokenDefinitionId] = remaining;
  }
  return next;
}
