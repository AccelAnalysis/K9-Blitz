import test from "node:test";
import assert from "node:assert/strict";
import {
  LAST_SPACE,
  advancePosition,
  advanceTurn,
  applyCardEffect,
  applySpaceEffect,
  createGame,
  dieFromRandom,
  rollDice,
} from "../game-engine.js";

test("dice map deterministic random values into 1-6", () => {
  assert.equal(dieFromRandom(0), 1);
  assert.equal(dieFromRandom(0.999999), 6);
  const values = [0, 5 / 6];
  const roll = rollDice(() => values.shift());
  assert.deepEqual(roll, { first: 1, second: 6, total: 7 });
});

test("movement clamps at start and finish", () => {
  assert.equal(advancePosition(0, -3), 0);
  assert.equal(advancePosition(LAST_SPACE - 1, 12), LAST_SPACE);
});

test("game state initializes 2-4 unique players", () => {
  const game = createGame([
    { id: "p1", name: "A", pawnId: "red", dogId: "max", controllerType: "human" },
    { id: "p2", name: "B", pawnId: "blue", dogId: "luna", controllerType: "computer" },
  ], () => 123);
  assert.equal(game.activePlayerIndex, 0);
  assert.equal(game.players.length, 2);
  assert.equal(game.players[1].position, 0);
  assert.equal(game.startedAt, 123);
});

test("space effects never create negative token inventory", () => {
  const player = { position: 2, tokens: 0, competition: 0, cardsDrawn: 0 };
  const result = applySpaceEffect(player, { type: "vet", title: "Vet Check" });
  assert.equal(result.tokens, 0);
});

test("card effects clamp competition progress", () => {
  const player = { position: 2, tokens: 0, competition: 7, cardsDrawn: 0 };
  const result = applyCardEffect(player, {
    effect: { type: "competition", amount: 2 },
  });
  assert.equal(result.player.competition, 8);
  assert.equal(result.player.cardsDrawn, 1);
});

test("extra turns preserve the active player exactly once", () => {
  const base = createGame([
    { id: "p1", name: "A", pawnId: "red", dogId: "max", controllerType: "human" },
    { id: "p2", name: "B", pawnId: "blue", dogId: "luna", controllerType: "human" },
  ], () => 1);
  const same = advanceTurn({ ...base, extraTurn: true }, () => 2);
  assert.equal(same.activePlayerIndex, 0);
  assert.equal(same.extraTurn, false);
  const next = advanceTurn(same, () => 3);
  assert.equal(next.activePlayerIndex, 1);
});
