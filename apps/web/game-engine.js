import { BOARD_SPACES, CONTENT_VERSION, DIGITAL_RULES, RULES_VERSION, TRAINER_CARDS } from "./game-data.js";

export const MAX_COMPETITION = DIGITAL_RULES.competitionMaximum;
export const LAST_SPACE = BOARD_SPACES.length - 1;

export function dieFromRandom(randomValue) {
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError("Random value must be >= 0 and < 1");
  }
  return Math.floor(randomValue * 6) + 1;
}

export function rollDice(random = Math.random) {
  const first = dieFromRandom(random());
  const second = dieFromRandom(random());
  return { first, second, total: first + second };
}

export function advancePosition(position, amount) {
  if (!Number.isInteger(position) || !Number.isInteger(amount)) {
    throw new TypeError("Position and movement must be integers");
  }
  return Math.max(0, Math.min(LAST_SPACE, position + amount));
}

export function createGame(players, now = () => Date.now()) {
  if (!Array.isArray(players) || players.length < DIGITAL_RULES.players.min || players.length > DIGITAL_RULES.players.max) {
    throw new RangeError(`K9 Blitz Digital Rules v${DIGITAL_RULES.displayVersion} support ${DIGITAL_RULES.players.min}-${DIGITAL_RULES.players.max} players`);
  }
  const ids = new Set();
  const pawnIds = new Set();
  for (const player of players) {
    if (!player.id || ids.has(player.id)) throw new Error("Players require unique IDs");
    if (!player.pawnId || pawnIds.has(player.pawnId)) throw new Error("Players require unique pawns");
    ids.add(player.id);
    pawnIds.add(player.pawnId);
  }
  const startedAt = now();
  return {
    version: 1,
    rulesVersion: RULES_VERSION,
    contentVersion: CONTENT_VERSION,
    status: "playing",
    activePlayerIndex: 0,
    round: 1,
    dice: null,
    deckCursor: 0,
    startedAt,
    updatedAt: startedAt,
    winnerPlayerId: null,
    extraTurn: false,
    players: players.map((player) => ({
      ...player,
      position: 0,
      tokens: 0,
      competition: 0,
      cardsDrawn: 0,
    })),
    history: [
      { id: `event-${startedAt}`, at: startedAt, type: "game", text: `Game started with K9 Blitz Digital Rules v${DIGITAL_RULES.displayVersion}.` },
    ],
  };
}

export function drawTrainerCard(state) {
  const card = TRAINER_CARDS[state.deckCursor % TRAINER_CARDS.length];
  return { card, nextCursor: (state.deckCursor + 1) % TRAINER_CARDS.length };
}

export function applyCardEffect(player, card) {
  const next = { ...player };
  let extraTurn = false;
  const effect = card.effect;
  switch (effect.type) {
    case "tokens":
      next.tokens = Math.max(0, next.tokens + effect.amount);
      break;
    case "competition":
      next.competition = Math.min(MAX_COMPETITION, next.competition + effect.amount);
      break;
    case "move":
      next.position = advancePosition(next.position, effect.amount);
      break;
    case "extraTurn":
      extraTurn = true;
      break;
    case "combo":
      next.tokens += effect.tokens;
      next.competition = Math.min(MAX_COMPETITION, next.competition + effect.competition);
      break;
    case "comboMove":
      next.tokens += effect.tokens;
      next.position = advancePosition(next.position, effect.move);
      break;
    case "none":
      break;
    default:
      throw new Error(`Unknown card effect ${effect.type}`);
  }
  next.cardsDrawn += 1;
  return { player: next, extraTurn };
}

export function applySpaceEffect(player, space) {
  const next = { ...player };
  switch (space.type) {
    case "token":
    case "daycare":
      next.tokens += space.title === "Treat Stop" ? 2 : 1;
      break;
    case "training":
    case "agility":
    case "competition":
      if (space.title === "Obedience Class") next.tokens += 1;
      else next.competition = Math.min(MAX_COMPETITION, next.competition + 1);
      break;
    case "vet":
      next.tokens = Math.max(0, next.tokens - 1);
      break;
    case "normal":
    case "trainer":
    case "finish":
      break;
    default:
      throw new Error(`Unknown space type ${space.type}`);
  }
  return next;
}

export function replacePlayer(state, playerIndex, player) {
  return {
    ...state,
    players: state.players.map((candidate, index) => index === playerIndex ? player : candidate),
  };
}

export function appendHistory(state, text, type = "turn", now = () => Date.now()) {
  const at = now();
  return {
    ...state,
    updatedAt: at,
    history: [
      ...state.history,
      { id: `event-${at}-${state.history.length}`, at, type, text },
    ].slice(-100),
  };
}

export function advanceTurn(state, now = () => Date.now()) {
  if (state.status !== "playing") return state;
  if (state.extraTurn) {
    return { ...state, extraTurn: false, dice: null, updatedAt: now() };
  }
  const nextIndex = (state.activePlayerIndex + 1) % state.players.length;
  const wraps = nextIndex === 0;
  return {
    ...state,
    activePlayerIndex: nextIndex,
    round: wraps ? state.round + 1 : state.round,
    dice: null,
    updatedAt: now(),
  };
}

export function declareWinnerIfFinished(state, playerIndex) {
  const player = state.players[playerIndex];
  if (!player || player.position < LAST_SPACE) return state;
  return {
    ...state,
    status: "finished",
    winnerPlayerId: player.id,
  };
}
