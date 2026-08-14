import assert from "node:assert/strict";
import test from "node:test";

import type { EngineContext, GameState, RandomSource } from "./contracts.ts";
import {
  createK9BlitzDigitalGameInput,
  K9_BLITZ_DIGITAL_CONTENT_VERSION,
  K9_BLITZ_DIGITAL_RULES_V1,
  K9_BLITZ_DIGITAL_RULES_VERSION,
} from "./digitalRulesV1.ts";
import { createGameState, executeCommand } from "./engine.ts";

class SequenceRandom implements RandomSource {
  #values: number[];

  constructor(values: readonly number[]) {
    this.#values = [...values];
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    const value = this.#values.shift();
    if (value === undefined) throw new Error("SequenceRandom is exhausted.");
    if (value < minInclusive || value > maxInclusive) {
      throw new Error(`SequenceRandom produced ${value}; expected ${minInclusive}..${maxInclusive}.`);
    }
    return value;
  }
}

function context(values: readonly number[] = []): EngineContext {
  let tick = 0;
  return {
    rules: K9_BLITZ_DIGITAL_RULES_V1,
    random: new SequenceRandom(values),
    clock: {
      now() {
        tick += 1;
        return `2026-08-13T22:30:${String(tick).padStart(2, "0")}-04:00`;
      },
    },
  };
}

function newInput() {
  return createK9BlitzDigitalGameInput("game-v1", [
    { id: "player-1", displayName: "Player One", seatIndex: 0, pawnId: "red", dogId: "max" },
    { id: "player-2", displayName: "Player Two", seatIndex: 1, pawnId: "blue", dogId: "luna" },
  ]);
}

function startGame(ctx: EngineContext): GameState {
  const ready = createGameState(newInput(), ctx);
  const started = executeCommand(ready, {
    type: "START_GAME",
    commandId: "start",
    actorPlayerId: "player-1",
    expectedRevision: 0,
  }, ctx);
  assert.equal(started.ok, true);
  if (!started.ok) throw new Error(started.message);
  return started.state;
}

test("creates a version-bound official digital-rules game", () => {
  const ctx = context();
  const state = createGameState(newInput(), ctx);

  assert.equal(state.rulesetId, "k9-blitz-digital");
  assert.equal(state.rulesVersion, K9_BLITZ_DIGITAL_RULES_VERSION);
  assert.equal(state.contentVersion, K9_BLITZ_DIGITAL_CONTENT_VERSION);
  assert.equal(state.domain.players.length, 2);
  assert.equal(state.domain.players[0]?.boardSpaceId, "space-0");
  assert.equal(state.domain.tokens.bag.length, 48);
  assert.equal(state.domain.decks.trainer?.drawPile.length, 12);
});

test("rolls two dice, moves along the route, and resolves Obedience Class", () => {
  const ctx = context([2, 2, 0]);
  const started = startGame(ctx);
  const result = executeCommand(started, {
    type: "ROLL_DICE",
    commandId: "roll-obedience",
    actorPlayerId: "player-1",
    expectedRevision: started.revision,
  }, ctx);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const player = result.state.domain.players.find((candidate) => candidate.id === "player-1");
  assert.equal(player?.boardSpaceId, "space-4");
  assert.equal(player?.tokenIds.length, 1);
  assert.equal(result.state.currentPlayerId, "player-2");
  assert.ok(result.events.some((event) => event.type === "DICE_ROLLED"));
  assert.ok(result.events.some((event) => event.type === "PAWN_MOVED"));
  assert.ok(result.events.some((event) => event.type === "DOMAIN_EVENT" && event.payload.name === "PAW_TOKENS_GAINED"));
});

test("draws Trainer Cards without replacement, discards them, and applies card effects", () => {
  const ctx = context([4, 5, 0, 0, 0]);
  const started = startGame(ctx);
  const result = executeCommand(started, {
    type: "ROLL_DICE",
    commandId: "roll-trainer",
    actorPlayerId: "player-1",
    expectedRevision: started.revision,
  }, ctx);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  const player = result.state.domain.players.find((candidate) => candidate.id === "player-1");
  assert.equal(player?.boardSpaceId, "space-9");
  assert.deepEqual(player?.cardIds, []);
  assert.equal(player?.data.cardsDrawn, 1);
  assert.equal(player?.tokenIds.length, 2);
  assert.equal(result.state.domain.decks.trainer?.drawPile.length, 11);
  assert.deepEqual(result.state.domain.decks.trainer?.discardPile, ["good-behavior"]);
});

test("Second Chance grants exactly one immediate extra turn", () => {
  const ctx = context([4, 5, 7]);
  const started = startGame(ctx);
  const result = executeCommand(started, {
    type: "ROLL_DICE",
    commandId: "roll-second-chance",
    actorPlayerId: "player-1",
    expectedRevision: started.revision,
  }, ctx);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.currentPlayerId, "player-1");
  assert.equal(result.state.turnNumber, 2);
  assert.equal(result.state.turn?.phase, "awaiting_roll");
});

test("reaching space 71 ends the game and records the winner", () => {
  const ctx = context([3, 3]);
  const started = startGame(ctx);
  const nearFinish: GameState = {
    ...started,
    domain: {
      ...started.domain,
      players: started.domain.players.map((player) => player.id === "player-1"
        ? { ...player, boardSpaceId: "space-65" }
        : player),
    },
  };

  const result = executeCommand(nearFinish, {
    type: "ROLL_DICE",
    commandId: "roll-finish",
    actorPlayerId: "player-1",
    expectedRevision: nearFinish.revision,
  }, ctx);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.status, "completed");
  assert.equal(result.state.winner?.playerId, "player-1");
  assert.equal(result.state.domain.players[0]?.boardSpaceId, "space-71");
  assert.ok(result.events.some((event) => event.type === "GAME_COMPLETED"));
});

test("setup rejects duplicate pawns and unsupported player counts", () => {
  assert.throws(() => createK9BlitzDigitalGameInput("solo", [
    { id: "solo", displayName: "Solo", seatIndex: 0, pawnId: "red" },
  ]), /2-4 players/);

  assert.throws(() => createK9BlitzDigitalGameInput("dupe", [
    { id: "one", displayName: "One", seatIndex: 0, pawnId: "red" },
    { id: "two", displayName: "Two", seatIndex: 1, pawnId: "red" },
  ]), /Pawn IDs must be unique/);
});
