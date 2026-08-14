import type { GameState } from "./contracts.ts";

export class StateInvariantError extends Error {
  readonly violations: readonly string[];

  constructor(violations: readonly string[]) {
    super(`Game state invariant violation: ${violations.join("; ")}`);
    this.name = "StateInvariantError";
    this.violations = violations;
  }
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

function addUniqueLocation(
  locations: Map<string, string>,
  id: string,
  location: string,
  violations: string[],
  kind: "card" | "token",
): void {
  const previous = locations.get(id);
  if (previous) {
    violations.push(`${kind} ${id} exists in multiple locations: ${previous}, ${location}`);
  } else {
    locations.set(id, location);
  }
}

export function collectInvariantViolations(state: Readonly<GameState>): string[] {
  const violations: string[] = [];
  const playerIds = state.domain.players.map((player) => player.id);
  const duplicatePlayers = duplicates(playerIds);
  if (duplicatePlayers.length > 0) violations.push(`duplicate player ids: ${duplicatePlayers.join(", ")}`);

  const turnOrderDuplicates = duplicates(state.turnOrder);
  if (turnOrderDuplicates.length > 0) {
    violations.push(`duplicate turn-order player ids: ${turnOrderDuplicates.join(", ")}`);
  }

  const playerSet = new Set(playerIds);
  const orderSet = new Set(state.turnOrder);
  if (playerIds.some((id) => !orderSet.has(id)) || state.turnOrder.some((id) => !playerSet.has(id))) {
    violations.push("turn order must contain exactly the game's players");
  }

  if (state.status === "active") {
    if (!state.currentPlayerId || !playerSet.has(state.currentPlayerId)) {
      violations.push("an active game must have a valid current player");
    }
    if (!state.turn) violations.push("an active game must have an active turn");
  }

  if (state.turn && state.currentPlayerId && state.turn.playerId !== state.currentPlayerId) {
    violations.push("active turn player must match currentPlayerId");
  }

  if (state.turn?.phase === "awaiting_decision") {
    if (!state.turn.pendingDecisionEffectId) {
      violations.push("awaiting_decision requires pendingDecisionEffectId");
    } else {
      const decision = state.pendingEffects.find((effect) => effect.id === state.turn?.pendingDecisionEffectId);
      if (!decision || decision.effect.type !== "CHOICE" || decision.status !== "waiting_for_player") {
        violations.push("awaiting_decision must reference a waiting choice effect");
      }
    }
  }

  if (
    state.pendingEffects.some((effect) => effect.status === "waiting_for_player") &&
    state.turn?.phase !== "awaiting_decision"
  ) {
    violations.push("waiting player effect requires awaiting_decision turn phase");
  }

  if (state.status === "completed" && !state.winner) {
    violations.push("completed game must have winner state");
  }
  if (state.winner && state.status !== "completed") {
    violations.push("winner state may only exist for a completed game");
  }

  const cardLocations = new Map<string, string>();
  for (const deck of Object.values(state.domain.decks)) {
    for (const cardId of deck.drawPile) addUniqueLocation(cardLocations, cardId, `deck:${deck.id}:draw`, violations, "card");
    for (const cardId of deck.discardPile) addUniqueLocation(cardLocations, cardId, `deck:${deck.id}:discard`, violations, "card");
  }
  for (const player of state.domain.players) {
    for (const cardId of player.cardIds) addUniqueLocation(cardLocations, cardId, `player:${player.id}:hand`, violations, "card");
  }

  const tokenLocations = new Map<string, string>();
  for (const tokenId of state.domain.tokens.bag) addUniqueLocation(tokenLocations, tokenId, "token:bag", violations, "token");
  for (const tokenId of state.domain.tokens.discarded) addUniqueLocation(tokenLocations, tokenId, "token:discarded", violations, "token");
  for (const tokenId of state.domain.tokens.removed) addUniqueLocation(tokenLocations, tokenId, "token:removed", violations, "token");
  for (const player of state.domain.players) {
    for (const tokenId of player.tokenIds) addUniqueLocation(tokenLocations, tokenId, `player:${player.id}:tokens`, violations, "token");
  }

  const receiptIds = state.commandReceipts.map((receipt) => receipt.commandId);
  const duplicateReceipts = duplicates(receiptIds);
  if (duplicateReceipts.length > 0) {
    violations.push(`duplicate command receipts: ${duplicateReceipts.join(", ")}`);
  }

  let previousSequence = 0;
  for (const event of state.history) {
    if (event.sequence <= previousSequence) {
      violations.push("event history sequence must be strictly increasing");
      break;
    }
    previousSequence = event.sequence;
  }
  if (state.eventSequence !== previousSequence) {
    violations.push("eventSequence must equal the latest history sequence");
  }

  if (!Number.isInteger(state.revision) || state.revision < 0) {
    violations.push("revision must be a non-negative integer");
  }

  return violations;
}

export function assertStateInvariants(state: Readonly<GameState>): void {
  const violations = collectInvariantViolations(state);
  if (violations.length > 0) throw new StateInvariantError(violations);
}
