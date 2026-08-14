import { ComponentInvariantError, assertUniqueIds } from "./errors.js";
import { type RandomSource, mathRandomSource, shuffle } from "./random.js";

export interface TrainerCardEffectInstruction {
  readonly effectId: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface TrainerCardDefinition {
  readonly id: string;
  readonly deckId: string;
  readonly title: string;
  readonly text: string;
  readonly frontAssetId?: string;
  readonly backAssetId?: string;
  readonly effects: readonly TrainerCardEffectInstruction[];
  readonly tags?: readonly string[];
}

/** A physical copy of a card. Multiple instances may point to the same definition. */
export interface TrainerCardInstance {
  readonly instanceId: string;
  readonly definitionId: string;
}

export interface TrainerDeckState {
  readonly deckId: string;
  readonly drawPile: readonly string[];
  readonly discardPile: readonly string[];
}

export interface TrainerCardDrawResult {
  readonly cardInstanceId: string;
  readonly state: TrainerDeckState;
}

/**
 * Digital Rules v1 uses a public authored sequence that wraps after the final card.
 * Keep this separate from the generic shuffled finite-deck primitive below.
 */
export interface CyclicTrainerDeckState {
  readonly deckId: string;
  readonly orderedInstanceIds: readonly string[];
  readonly cursor: number;
}

export interface CyclicTrainerCardDrawResult {
  readonly cardInstanceId: string;
  readonly state: CyclicTrainerDeckState;
}

export function createCyclicTrainerDeck(
  deckId: string,
  instances: readonly TrainerCardInstance[],
): CyclicTrainerDeckState {
  assertUniqueIds(
    instances.map((card) => card.instanceId),
    `Trainer deck ${deckId}`,
  );
  if (instances.length === 0) {
    throw new ComponentInvariantError(
      "TRAINER_DECK_EMPTY",
      `Trainer deck ${deckId} requires at least one card instance.`,
    );
  }

  return {
    deckId,
    orderedInstanceIds: instances.map((card) => card.instanceId),
    cursor: 0,
  };
}

export function drawCyclicTrainerCard(
  state: CyclicTrainerDeckState,
): CyclicTrainerCardDrawResult {
  const cardInstanceId = state.orderedInstanceIds[state.cursor];
  if (cardInstanceId === undefined) {
    throw new ComponentInvariantError(
      "INVALID_TRAINER_DECK_CURSOR",
      `Trainer deck ${state.deckId} has invalid cursor ${state.cursor}.`,
    );
  }

  return {
    cardInstanceId,
    state: {
      ...state,
      cursor: (state.cursor + 1) % state.orderedInstanceIds.length,
    },
  };
}

export function createTrainerDeck(
  deckId: string,
  instances: readonly TrainerCardInstance[],
  random: RandomSource = mathRandomSource,
): TrainerDeckState {
  assertUniqueIds(
    instances.map((card) => card.instanceId),
    `Trainer deck ${deckId}`,
  );

  return {
    deckId,
    drawPile: shuffle(
      instances.map((card) => card.instanceId),
      random,
    ),
    discardPile: [],
  };
}

export function drawTrainerCard(state: TrainerDeckState): TrainerCardDrawResult {
  const [cardInstanceId, ...remaining] = state.drawPile;
  if (cardInstanceId === undefined) {
    throw new ComponentInvariantError(
      "TRAINER_DECK_EMPTY",
      `Trainer deck ${state.deckId} has no cards remaining in its draw pile.`,
    );
  }

  return {
    cardInstanceId,
    state: {
      ...state,
      drawPile: remaining,
    },
  };
}

/** Moves an already-drawn card into the discard pile. */
export function discardTrainerCard(
  state: TrainerDeckState,
  cardInstanceId: string,
): TrainerDeckState {
  if (state.drawPile.includes(cardInstanceId) || state.discardPile.includes(cardInstanceId)) {
    throw new ComponentInvariantError(
      "CARD_NOT_IN_PLAY",
      `Card ${cardInstanceId} must be outside the deck before it can be discarded.`,
    );
  }

  return {
    ...state,
    discardPile: [...state.discardPile, cardInstanceId],
  };
}

export function recycleTrainerDiscardPile(
  state: TrainerDeckState,
  random: RandomSource = mathRandomSource,
): TrainerDeckState {
  if (state.drawPile.length > 0) {
    throw new ComponentInvariantError(
      "DRAW_PILE_NOT_EMPTY",
      `Trainer deck ${state.deckId} can only recycle its discard pile when the draw pile is empty.`,
    );
  }

  return {
    ...state,
    drawPile: shuffle(state.discardPile, random),
    discardPile: [],
  };
}
