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

test("game state initializes canonical 2-5 player games with Seat 1 first", () => {
  const game = createGame([
    { id: "p1", name: "A", pawnId: "red", dogId: "max", controllerType: "human" },
    { id: "p2", name: "B", pawnId: "blue", dogId: "luna", controllerType: "computer" },
    { id: "p3", name: "C", pawnId: "green", dogId: "rookie", controllerType: "computer" },
    { id: "p4", name: "D", pawnId: "yellow", dogId: "ace", controllerType: "computer" },
    { id: "p5", name: "E", pawnId: "brown", dogId: "scout", controllerType: "computer" },
  ], () => 123);
  assert.equal(game.activePlayerIndex, 0);
  assert.equal(game.players.length, 5);
  assert.equal(game.players[4].position, 0);
  assert.equal(game.startedAt, 123);
  assert.equal(game.playerRulesId, "k9-blitz-player-rules-1.0");
  assert.equal(game.playerRuleProvenance, "owner_authorized_digital");
});

test("local and solo games require a human trainer in Seat 1", () => {
  assert.throws(() => createGame([
    { id: "p1", name: "CPU", pawnId: "red", dogId: "max", controllerType: "computer" },
    { id: "p2", name: "Human", pawnId: "blue", dogId: "luna", controllerType: "human" },
  ]), /Seat 1 must be a human trainer/);
});

test("players require unique pawns and unique dogs", () => {
  assert.throws(() => createGame([
    { id: "p1", name: "A", pawnId: "red", dogId: "max", controllerType: "human" },
    { id: "p2", name: "B", pawnId: "blue", dogId: "max", controllerType: "computer" },
  ]), /unique dogs/);

  assert.throws(() => createGame([
    { id: "p1", name: "A", pawnId: "red", dogId: "max", controllerType: "human" },
    { id: "p2", name: "B", pawnId: "red", dogId: "luna", controllerType: "computer" },
  ]), /unique pawns/);
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
