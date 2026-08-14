import type {
  CreateGameInput,
  DeckState,
  DiceResult,
  DomainEffect,
  DomainEffectResolution,
  DomainState,
  GameState,
  JsonObject,
  PlayerState,
  RandomSource,
  RuleEffect,
  RulesRuntime,
  TokenSystemState,
} from "./contracts.ts";

export const K9_BLITZ_DIGITAL_RULES_ID = "k9-blitz-digital-1.0";
export const K9_BLITZ_DIGITAL_RULES_VERSION = K9_BLITZ_DIGITAL_RULES_ID;
export const K9_BLITZ_DIGITAL_CONTENT_VERSION = "launch-1.0";
export const K9_BLITZ_LAST_SPACE_INDEX = 71;
export const K9_BLITZ_MAX_COMPETITION = 8;
export const K9_BLITZ_PAWN_IDS = ["red", "blue", "green", "yellow"] as const;

export interface K9BlitzDigitalPlayerSetup {
  readonly id: string;
  readonly displayName: string;
  /** Zero-based setup/seat index. */
  readonly seatIndex: number;
  /** Optional assertion; when supplied it must match setup-order pawn assignment. */
  readonly pawnId?: string;
  readonly dogId?: string | null;
}

interface TrainerCardDefinition {
  readonly id: string;
  readonly title: string;
  readonly effects: readonly DomainEffect[];
}

const TRAINER_CARDS: readonly TrainerCardDefinition[] = [
  card("good-behavior", "Good Behavior!", [domainEffect("GAIN_PAW_TOKENS", { amount: 2 })]),
  card("quick-study", "Quick Study", [domainEffect("ADVANCE_COMPETITION", { amount: 1 })]),
  card("zoomies", "Zoomies!", [domainEffect("MOVE_RELATIVE", { amount: 2 })]),
  card("water-break", "Water Break", []),
  card("treat-pouch", "Treat Pouch", [domainEffect("GAIN_PAW_TOKENS", { amount: 1 })]),
  card("practice-pays", "Practice Pays", [domainEffect("ADVANCE_COMPETITION", { amount: 2 })]),
  card("distracted", "Squirrel!", [domainEffect("MOVE_RELATIVE", { amount: -1 })]),
  card("second-chance", "Second Chance", [domainEffect("GRANT_EXTRA_TURN", {})]),
  card("park-pals", "Park Pals", [
    domainEffect("GAIN_PAW_TOKENS", { amount: 1 }),
    domainEffect("ADVANCE_COMPETITION", { amount: 1 }),
  ]),
  card("groomed", "Freshly Groomed", [domainEffect("GAIN_PAW_TOKENS", { amount: 2 })]),
  card("training-bonus", "Trainer's Bonus", [
    domainEffect("MOVE_RELATIVE", { amount: 1 }),
    domainEffect("GAIN_PAW_TOKENS", { amount: 1 }),
  ]),
  card("calm-focus", "Calm & Focused", [domainEffect("ADVANCE_COMPETITION", { amount: 1 })]),
];

export const K9_BLITZ_TRAINER_CARD_IDS = TRAINER_CARDS.map((definition) => definition.id);

export function createK9BlitzDigitalTrainerDeck(): DeckState {
  return {
    id: "trainer",
    drawPile: [...K9_BLITZ_TRAINER_CARD_IDS],
    discardPile: [],
    data: { drawPolicy: "cyclic-v1", visibility: "public", heldCards: false },
  };
}

export function createK9BlitzDigitalTokenSystem(): TokenSystemState {
  return {
    bag: [],
    discarded: [],
    removed: [],
    data: { model: "score-counter", canGoNegative: false },
  };
}

export function createK9BlitzDigitalGameInput(
  gameId: string,
  setups: readonly K9BlitzDigitalPlayerSetup[],
): CreateGameInput {
  if (setups.length < 2 || setups.length > 4) {
    throw new RangeError("K9 Blitz Digital Rules v1.0 supports 2-4 players.");
  }

  const ordered = [...setups].sort((left, right) => left.seatIndex - right.seatIndex);
  const playerIds = ordered.map((setup) => setup.id);
  const seatIndices = ordered.map((setup) => setup.seatIndex);
  if (new Set(playerIds).size !== playerIds.length) throw new Error("Player IDs must be unique.");
  if (new Set(seatIndices).size !== seatIndices.length) throw new Error("Seat indices must be unique.");
  if (seatIndices.some((seatIndex) => !Number.isInteger(seatIndex) || seatIndex < 0)) {
    throw new Error("Seat indices must be non-negative integers.");
  }

  const players: Omit<PlayerState, "boardSpaceId">[] = ordered.map((setup, index) => {
    const canonicalPawnId = K9_BLITZ_PAWN_IDS[index];
    if (!canonicalPawnId) throw new Error(`No launch pawn exists for seat index ${index}.`);
    if (setup.pawnId !== undefined && setup.pawnId !== canonicalPawnId) {
      throw new Error(`Seat ${index + 1} must use pawn ${canonicalPawnId} under Digital Rules v1.`);
    }
    return {
      id: setup.id,
      displayName: setup.displayName,
      seatIndex: setup.seatIndex,
      dogId: setup.dogId ?? null,
      cardIds: [],
      tokenIds: [],
      statuses: [],
      finished: false,
      data: {
        pawnId: canonicalPawnId,
        competition: 0,
        cardsDrawn: 0,
      },
    };
  });

  return {
    gameId,
    players,
    turnOrder: players.map((player) => player.id),
    decks: { trainer: createK9BlitzDigitalTrainerDeck() },
    tokens: createK9BlitzDigitalTokenSystem(),
    competition: {
      participants: Object.fromEntries(players.map((player) => [player.id, { progress: 0 }])),
      activeCompetition: null,
      data: { maxProgress: K9_BLITZ_MAX_COMPETITION },
    },
    extensions: {},
  };
}

export const K9_BLITZ_DIGITAL_RULES_V1: RulesRuntime = {
  metadata: {
    id: K9_BLITZ_DIGITAL_RULES_ID,
    rulesVersion: K9_BLITZ_DIGITAL_RULES_VERSION,
    contentVersion: K9_BLITZ_DIGITAL_CONTENT_VERSION,
    minPlayers: 2,
    maxPlayers: 4,
  },
  startSpaceId: "space-0",
  turnPolicy: { endTurn: "automatic" },

  rollDice(random: RandomSource): DiceResult {
    const first = checkedRandomInt(random, 1, 6);
    const second = checkedRandomInt(random, 1, 6);
    return { dice: [first, second], total: first + second };
  },

  calculateMovement(state, playerId, dice) {
    const player = requirePlayer(state.domain, playerId);
    const fromIndex = parseSpaceIndex(player.boardSpaceId);
    const destinationIndex = clamp(fromIndex + dice.total, 0, K9_BLITZ_LAST_SPACE_INDEX);
    const path: string[] = [];
    for (let index = fromIndex + 1; index <= destinationIndex; index += 1) {
      path.push(spaceId(index));
    }
    return {
      from: player.boardSpaceId,
      path,
      to: spaceId(destinationIndex),
      distance: destinationIndex - fromIndex,
    };
  },

  getLandingEffects(_state, _playerId, landedSpaceId) {
    return effectsForSpace(parseSpaceIndex(landedSpaceId));
  },

  resolveDomainEffect(domain, effect, context) {
    return resolveDigitalDomainEffect(
      domain,
      effect,
      context.gameState,
      context.targetPlayerId,
    );
  },

  evaluateVictory(state) {
    const active = state.currentPlayerId
      ? state.domain.players.find((player) => player.id === state.currentPlayerId)
      : undefined;
    const winner = active && parseSpaceIndex(active.boardSpaceId) >= K9_BLITZ_LAST_SPACE_INDEX
      ? active
      : state.domain.players.find((player) => parseSpaceIndex(player.boardSpaceId) >= K9_BLITZ_LAST_SPACE_INDEX);

    if (!winner) return { won: false };
    return {
      won: true,
      winner: {
        playerId: winner.id,
        dogId: winner.dogId,
        reason: "Reached the Barkley Ville Finish podium.",
        data: {
          competition: competitionProgress(winner),
          pawTokens: winner.tokenIds.length,
          cardsDrawn: numberFromJson(winner.data.cardsDrawn),
        },
      },
    };
  },

  getNextPlayerId(state, currentPlayerId) {
    const extraTurn = objectFromJson(state.domain.extensions.extraTurn);
    if (
      extraTurn &&
      extraTurn.playerId === currentPlayerId &&
      extraTurn.turnNumber === state.turnNumber
    ) return currentPlayerId;

    const currentIndex = state.turnOrder.indexOf(currentPlayerId);
    if (currentIndex < 0) throw new Error(`Current player ${currentPlayerId} is not in turn order.`);
    return state.turnOrder[(currentIndex + 1) % state.turnOrder.length] ?? currentPlayerId;
  },
};

function resolveDigitalDomainEffect(
  domain: Readonly<DomainState>,
  effect: DomainEffect,
  gameState: Readonly<GameState>,
  targetPlayerId: string,
): DomainEffectResolution {
  switch (effect.effectType) {
    case "GAIN_PAW_TOKENS":
      return gainPawTokens(domain, targetPlayerId, nonNegativeAmount(effect.payload.amount));
    case "SPEND_PAW_TOKENS":
      return spendPawTokens(domain, targetPlayerId, nonNegativeAmount(effect.payload.amount));
    case "ADVANCE_COMPETITION":
      return advanceCompetition(domain, targetPlayerId, nonNegativeAmount(effect.payload.amount));
    case "DRAW_TRAINER_CARD":
      return drawTrainerCard(domain, targetPlayerId);
    case "MOVE_RELATIVE":
      return moveRelative(domain, targetPlayerId, integerAmount(effect.payload.amount));
    case "GRANT_EXTRA_TURN":
      return grantExtraTurn(domain, targetPlayerId, gameState.turnNumber);
    default:
      throw new Error(`Digital Rules v1 cannot resolve effect ${effect.effectType}.`);
  }
}

function gainPawTokens(
  domain: Readonly<DomainState>,
  playerId: string,
  amount: number,
): DomainEffectResolution {
  const discarded = [...domain.tokens.discarded];
  const used = allTokenIds(domain);
  const gained: string[] = [];
  for (let count = 0; count < amount; count += 1) {
    const recycled = discarded.shift();
    if (recycled) {
      gained.push(recycled);
      continue;
    }
    const tokenId = nextTokenId(used);
    used.add(tokenId);
    gained.push(tokenId);
  }

  const players = replacePlayer(domain.players, playerId, (player) => ({
    ...player,
    tokenIds: [...player.tokenIds, ...gained],
  }));
  return {
    domain: {
      ...domain,
      players,
      tokens: { ...domain.tokens, discarded },
    },
    events: [{
      name: "PAW_TOKENS_GAINED",
      playerId,
      payload: { amount: gained.length, tokenIds: gained },
    }],
  };
}

function spendPawTokens(
  domain: Readonly<DomainState>,
  playerId: string,
  amount: number,
): DomainEffectResolution {
  const player = requirePlayer(domain, playerId);
  const spent = player.tokenIds.slice(0, amount);
  const players = replacePlayer(domain.players, playerId, (candidate) => ({
    ...candidate,
    tokenIds: candidate.tokenIds.slice(spent.length),
  }));
  return {
    domain: {
      ...domain,
      players,
      tokens: {
        ...domain.tokens,
        discarded: [...domain.tokens.discarded, ...spent],
      },
    },
    events: [{
      name: "PAW_TOKENS_SPENT",
      playerId,
      payload: { requested: amount, spent: spent.length, tokenIds: spent },
    }],
  };
}

function advanceCompetition(
  domain: Readonly<DomainState>,
  playerId: string,
  amount: number,
): DomainEffectResolution {
  let nextProgress = 0;
  const players = replacePlayer(domain.players, playerId, (player) => {
    nextProgress = Math.min(K9_BLITZ_MAX_COMPETITION, competitionProgress(player) + amount);
    return {
      ...player,
      data: { ...player.data, competition: nextProgress },
    };
  });
  return {
    domain: {
      ...domain,
      players,
      competition: {
        ...domain.competition,
        participants: {
          ...domain.competition.participants,
          [playerId]: { progress: nextProgress },
        },
      },
    },
    events: [{
      name: "COMPETITION_ADVANCED",
      playerId,
      payload: { amount, progress: nextProgress, maximum: K9_BLITZ_MAX_COMPETITION },
    }],
  };
}

function drawTrainerCard(
  domain: Readonly<DomainState>,
  playerId: string,
): DomainEffectResolution {
  const existing = domain.decks.trainer ?? createK9BlitzDigitalTrainerDeck();
  let drawPile = [...existing.drawPile];
  let discardPile = [...existing.discardPile];
  if (drawPile.length === 0) {
    drawPile = [...discardPile];
    discardPile = [];
  }
  const cardId = drawPile.shift();
  if (!cardId) throw new Error("Trainer Card deck contains no cards.");
  const definition = TRAINER_CARDS.find((candidate) => candidate.id === cardId);
  if (!definition) throw new Error(`Unknown Trainer Card ${cardId}.`);
  discardPile.push(cardId);

  const players = replacePlayer(domain.players, playerId, (player) => ({
    ...player,
    data: { ...player.data, cardsDrawn: numberFromJson(player.data.cardsDrawn) + 1 },
  }));
  return {
    domain: {
      ...domain,
      players,
      decks: {
        ...domain.decks,
        trainer: { ...existing, drawPile, discardPile },
      },
    },
    events: [{
      name: "TRAINER_CARD_DRAWN",
      playerId,
      payload: { cardId, title: definition.title },
    }],
    followUpEffects: definition.effects,
  };
}

function moveRelative(
  domain: Readonly<DomainState>,
  playerId: string,
  amount: number,
): DomainEffectResolution {
  const player = requirePlayer(domain, playerId);
  const fromIndex = parseSpaceIndex(player.boardSpaceId);
  const destinationIndex = clamp(fromIndex + amount, 0, K9_BLITZ_LAST_SPACE_INDEX);
  const destination = spaceId(destinationIndex);
  const players = replacePlayer(domain.players, playerId, (candidate) => ({
    ...candidate,
    boardSpaceId: destination,
  }));
  return {
    domain: { ...domain, players },
    events: [{
      name: "CARD_MOVEMENT_APPLIED",
      playerId,
      payload: {
        from: player.boardSpaceId,
        to: destination,
        amount: destinationIndex - fromIndex,
        destinationSpaceResolved: false,
      },
    }],
  };
}

function grantExtraTurn(
  domain: Readonly<DomainState>,
  playerId: string,
  turnNumber: number,
): DomainEffectResolution {
  return {
    domain: {
      ...domain,
      extensions: {
        ...domain.extensions,
        extraTurn: { playerId, turnNumber },
      },
    },
    events: [{
      name: "EXTRA_TURN_GRANTED",
      playerId,
      payload: { turnNumber },
    }],
  };
}

function effectsForSpace(index: number): readonly RuleEffect[] {
  switch (index) {
    case 2:
    case 15:
    case 48:
    case 56:
    case 67:
      return [spaceEffect(index, "ADVANCE_COMPETITION", { amount: 1 })];
    case 4:
    case 14:
    case 20:
    case 28:
      return [spaceEffect(index, "GAIN_PAW_TOKENS", { amount: 1 })];
    case 36:
    case 52:
    case 65:
      return [spaceEffect(index, "GAIN_PAW_TOKENS", { amount: 2 })];
    case 19:
    case 58:
      return [spaceEffect(index, "SPEND_PAW_TOKENS", { amount: 1 })];
    case 9:
    case 22:
    case 32:
    case 42:
    case 62:
      return [spaceEffect(index, "DRAW_TRAINER_CARD", {})];
    case 0:
    case K9_BLITZ_LAST_SPACE_INDEX:
      return [];
    default:
      return index % 5 === 0
        ? [spaceEffect(index, "GAIN_PAW_TOKENS", { amount: 1 })]
        : [];
  }
}

function spaceEffect(index: number, effectType: string, payload: JsonObject): DomainEffect {
  return {
    type: "DOMAIN",
    effectType,
    payload,
    source: { kind: "space", id: spaceId(index) },
  };
}

function domainEffect(effectType: string, payload: JsonObject): DomainEffect {
  return { type: "DOMAIN", effectType, payload };
}

function card(id: string, title: string, effects: readonly DomainEffect[]): TrainerCardDefinition {
  return {
    id,
    title,
    effects: effects.map((effect) => ({ ...effect, source: { kind: "card", id } })),
  };
}

function requirePlayer(domain: Readonly<DomainState>, playerId: string): PlayerState {
  const player = domain.players.find((candidate) => candidate.id === playerId);
  if (!player) throw new Error(`Unknown player ${playerId}.`);
  return player;
}

function replacePlayer(
  players: readonly PlayerState[],
  playerId: string,
  update: (player: PlayerState) => PlayerState,
): PlayerState[] {
  let found = false;
  const next = players.map((player) => {
    if (player.id !== playerId) return player;
    found = true;
    return update(player);
  });
  if (!found) throw new Error(`Unknown player ${playerId}.`);
  return next;
}

function competitionProgress(player: PlayerState): number {
  return clamp(numberFromJson(player.data.competition), 0, K9_BLITZ_MAX_COMPETITION);
}

function allTokenIds(domain: Readonly<DomainState>): Set<string> {
  const ids = new Set<string>([
    ...domain.tokens.bag,
    ...domain.tokens.discarded,
    ...domain.tokens.removed,
  ]);
  for (const player of domain.players) {
    for (const tokenId of player.tokenIds) ids.add(tokenId);
  }
  return ids;
}

function nextTokenId(used: ReadonlySet<string>): string {
  let sequence = used.size + 1;
  while (used.has(`paw-token-${sequence}`)) sequence += 1;
  return `paw-token-${sequence}`;
}

function numberFromJson(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function objectFromJson(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nonNegativeAmount(value: unknown): number {
  const amount = integerAmount(value);
  if (amount < 0) throw new Error(`Expected a non-negative effect amount; received ${amount}.`);
  return amount;
}

function integerAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`Expected an integer effect amount; received ${String(value)}.`);
  }
  return value;
}

function checkedRandomInt(random: RandomSource, minInclusive: number, maxInclusive: number): number {
  const value = random.nextInt(minInclusive, maxInclusive);
  if (!Number.isInteger(value) || value < minInclusive || value > maxInclusive) {
    throw new Error(`Random source returned ${value}; expected ${minInclusive}..${maxInclusive}.`);
  }
  return value;
}

function parseSpaceIndex(id: string): number {
  const match = /^space-(\d+)$/.exec(id);
  if (!match?.[1]) throw new Error(`Invalid Digital Rules v1 space ID ${id}.`);
  const index = Number(match[1]);
  if (!Number.isInteger(index) || index < 0 || index > K9_BLITZ_LAST_SPACE_INDEX) {
    throw new Error(`Space ${id} is outside the Digital Rules v1 route.`);
  }
  return index;
}

function spaceId(index: number): string {
  return `space-${clamp(index, 0, K9_BLITZ_LAST_SPACE_INDEX)}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
