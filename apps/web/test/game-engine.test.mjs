import test from "node:test";
import assert from "node:assert/strict";
import { CONTENT_VERSION, DIGITAL_RULES, RULES_VERSION } from "../game-data.js";
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

test("digital rules v1 metadata is explicit and versioned", () => {
  assert.equal(RULES_VERSION, "k9-blitz-digital-1.0");
  assert.equal(CONTENT_VERSION, "launch-1.0");
  assert.equal(DIGITAL_RULES.players.min, 2);
  assert.equal(DIGITAL_RULES.players.max, 4);
  assert.equal(DIGITAL_RULES.victory, "first-to-finish");
  assert.equal(DIGITAL_RULES.trainerCardMovementTriggersLanding, false);
});

test("dice map deterministic random values into 1-6", () => {
  assert.equal(dieFromRandom(0), 1);
  assert.equal(dieFromRandom(0.999999), 6);
  const values = [0, 5 / 6];
  const roll = rollDice(() => values.shift());
  assert.deepEqual(roll, { first: 1, second: 6, total: 7 });
});

test("movement clamps at start and finish so exact finish roll is not required", () => {
  assert.equal(advancePosition(0, -3), 0);
  assert.equal(advancePosition(LAST_SPACE - 1, 12), LAST_SPACE);
});

test("game state initializes 2-4 unique players under digital rules v1", () => {
  const game = createGame([
    { id: "p1", name: "A", pawnId: "red", dogId: "max", controllerType: "human" },
    { id: "p2", name: "B", pawnId: "blue", dogId: "luna", controllerType: "computer" },
  ], () => 123);
  assert.equal(game.activePlayerIndex, 0);
  assert.equal(game.players.length, 2);
  assert.equal(game.players[1].position, 0);
  assert.equal(game.startedAt, 123);
  assert.equal(game.rulesVersion, RULES_VERSION);
  assert.match(game.history[0].text, /K9 Blitz Digital Rules v1\.0/);
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
