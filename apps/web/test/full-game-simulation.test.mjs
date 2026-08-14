import assert from "node:assert/strict";
import test from "node:test";

import { BOARD_SPACES, CONTENT_VERSION, RULES_VERSION } from "../game-data.js";
import {
  LAST_SPACE,
  advancePosition,
  advanceTurn,
  applyCardEffect,
  applySpaceEffect,
  createGame,
  declareWinnerIfFinished,
  drawTrainerCard,
  replacePlayer,
  rollDice,
} from "../game-engine.js";

const players = [
  { id: "p1", name: "Trainer 1", pawnId: "red", dogId: "max", controllerType: "computer" },
  { id: "p2", name: "Trainer 2", pawnId: "blue", dogId: "luna", controllerType: "computer" },
  { id: "p3", name: "Trainer 3", pawnId: "green", dogId: "rookie", controllerType: "computer" },
  { id: "p4", name: "Trainer 4", pawnId: "yellow", dogId: "ace", controllerType: "computer" }
];

function seededRandom(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function playHeadless(seed) {
  const random = seededRandom(seed);
  let tick = 0;
  const now = () => ++tick;
  let state = createGame(players, now);
  assert.equal(state.rulesVersion, RULES_VERSION);
  assert.equal(state.contentVersion, CONTENT_VERSION);

  for (let turn = 0; turn < 500 && state.status === "playing"; turn += 1) {
    const playerIndex = state.activePlayerIndex;
    const dice = rollDice(random);
    state = { ...state, dice };

    let player = state.players[playerIndex];
    player = { ...player, position: advancePosition(player.position, dice.total) };
    state = replacePlayer(state, playerIndex, player);

    if (player.position >= LAST_SPACE) {
      state = declareWinnerIfFinished(state, playerIndex);
      break;
    }

    const space = BOARD_SPACES[player.position];
    assert.ok(space, `seed ${seed}: missing board space ${player.position}`);

    if (space.type === "trainer") {
      const { card, nextCursor } = drawTrainerCard(state);
      const result = applyCardEffect(player, card);
      state = replacePlayer({ ...state, deckCursor: nextCursor, extraTurn: state.extraTurn || result.extraTurn }, playerIndex, result.player);
    } else if (space.type !== "normal" && space.type !== "finish") {
      state = replacePlayer(state, playerIndex, applySpaceEffect(player, space));
    }

    player = state.players[playerIndex];
    if (player.position >= LAST_SPACE) {
      state = declareWinnerIfFinished(state, playerIndex);
      break;
    }
    state = advanceTurn(state, now);
  }

  assert.equal(state.status, "finished", `seed ${seed}: game did not finish within 500 turns`);
  assert.ok(state.winnerPlayerId, `seed ${seed}: finished game has no winner`);
  assert.ok(state.players.some((player) => player.id === state.winnerPlayerId && player.position === LAST_SPACE));

  for (const player of state.players) {
    assert.ok(Number.isInteger(player.position) && player.position >= 0 && player.position <= LAST_SPACE);
    assert.ok(Number.isInteger(player.tokens) && player.tokens >= 0);
    assert.ok(Number.isInteger(player.competition) && player.competition >= 0 && player.competition <= 8);
    assert.ok(Number.isInteger(player.cardsDrawn) && player.cardsDrawn >= 0);
  }

  const restored = JSON.parse(JSON.stringify(state));
  assert.deepEqual(restored, state, `seed ${seed}: completed state must survive JSON persistence round-trip`);
  return { winnerPlayerId: state.winnerPlayerId, round: state.round };
}

test("K9 Blitz Digital Rules v1.0 complete deterministically across 250 seeded four-player games", () => {
  for (let seed = 1; seed <= 250; seed += 1) playHeadless(seed);
});

test("the same seed reproduces the same winner and round", () => {
  assert.deepEqual(playHeadless(42), playHeadless(42));
});
