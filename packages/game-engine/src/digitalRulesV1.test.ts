import assert from "node:assert/strict";
import test from "node:test";

import type { EngineContext, GameState, RandomSource } from "./contracts.ts";
import {
  createK9BlitzDigitalGameInput,
  K9_BLITZ_DIGITAL_CONTENT_VERSION,
  K9_BLITZ_DIGITAL_RULES_ID,
  K9_BLITZ_DIGITAL_RULES_V1,
  K9_BLITZ_DIGITAL_RULES_VERSION,
  K9_BLITZ_TRAINER_CARD_IDS,
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
    if (!Number.isInteger(value) || value < minInclusive || value > maxInclusive) {
      throw new Error(`SequenceRandom produced ${String(value)}; expected ${minInclusive}..${maxInclusive}.`);
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

function setupInput() {
  return createK9BlitzDigitalGameInput("game-v1", [
    { id: "player-1", displayName: "Player One", seatIndex: 0, dogId: "max" },
    { id: "player-2", displayName: "Player Two", seatIndex: 1, dogId: "luna" },
  ]);
}

function startGame(ctx: EngineContext): GameState {
  const ready = createGameState(setupInput(), ctx);
  const started = executeCommand(ready, {
    type: "START_GAME",
    commandId: "start",
    actorPlayerId: "player-1",
    expectedRevision: ready.revision,
  }, ctx);
  assert.equal(started.ok, true);
  if (!started.ok) throw new Error(started.message);
  return started.state;
}

function replacePlayerSpace(state: GameState, playerId: string, boardSpaceId: string): GameState {
  return {
    ...state,
    domain: {
      ...state.domain,
      players: state.domain.players.map((player) => player.id === playerId
        ? { ...player, boardSpaceId }
        : player),
    },
  };
}

test("binds authoritative state to the canonical launch rules/content IDs", () => {
  const state = createGameState(setupInput(), context());
  assert.equal(state.rulesetId, K9_BLITZ_DIGITAL_RULES_ID);
  assert.equal(state.rulesVersion, K9_BLITZ_DIGITAL_RULES_VERSION);
  assert.equal(state.contentVersion, K9_BLITZ_DIGITAL_CONTENT_VERSION);
  assert.equal(state.rulesVersion, "k9-blitz-digital-1.0");
  assert.equal(state.contentVersion, "launch-1.0");
  assert.equal(state.domain.decks.trainer?.drawPile.length, 12);
});

test("normalizes setup order and canonical red-blue-green-yellow pawn assignment", () => {
  const input = createK9BlitzDigitalGameInput("ordered", [
    { id: "second", displayName: "Second", seatIndex: 1, pawnId: "blue" },
    { id: "first", displayName: "First", seatIndex: 0, pawnId: "red" },
  ]);
  assert.deepEqual(input.turnOrder, ["first", "second"]);
  assert.equal(input.players[0]?.data.pawnId, "red");
  assert.equal(input.players[1]?.data.pawnId, "blue");

  assert.throws(() => createK9BlitzDigitalGameInput("bad-pawn", [
    { id: "p1", displayName: "P1", seatIndex: 0, pawnId: "blue" },
    { id: "p2", displayName: "P2", seatIndex: 1, pawnId: "red" },
  ]), /Seat 1 must use pawn red/);
});

test("rolls two dice, moves by their sum, resolves Obedience Class, and auto-advances turn", () => {
  const ctx = context([2, 2]);
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
  assert.equal(result.state.turn?.phase, "awaiting_roll");
  assert.deepEqual(result.events.find((event) => event.type === "DICE_ROLLED")?.payload.dice, [2, 2]);
});

test("Trainer Cards resolve publicly in canonical cyclic order", () => {
  const ctx = context([4, 5, 4, 5]);
  const started = startGame(ctx);
  const first = executeCommand(started, {
    type: "ROLL_DICE",
    commandId: "draw-first",
    actorPlayerId: "player-1",
    expectedRevision: started.revision,
  }, ctx);
  assert.equal(first.ok, true);
  if (!first.ok) return;

  const firstPlayer = first.state.domain.players.find((player) => player.id === "player-1");
  assert.equal(firstPlayer?.boardSpaceId, "space-9");
  assert.equal(firstPlayer?.tokenIds.length, 2);
  assert.equal(firstPlayer?.data.cardsDrawn, 1);
  assert.deepEqual(firstPlayer?.cardIds, []);
  assert.equal(first.state.domain.decks.trainer?.discardPile[0], "good-behavior");

  const positioned = replacePlayerSpace(first.state, "player-2", "space-13");
  const second = executeCommand(positioned, {
    type: "ROLL_DICE",
    commandId: "draw-second",
    actorPlayerId: "player-2",
    expectedRevision: positioned.revision,
  }, ctx);
  assert.equal(second.ok, true);
  if (!second.ok) return;
  const secondPlayer = second.state.domain.players.find((player) => player.id === "player-2");
  assert.equal(secondPlayer?.boardSpaceId, "space-22");
  assert.equal(secondPlayer?.data.competition, 1);
  assert.deepEqual(second.state.domain.decks.trainer?.discardPile.slice(0, 2), [
    "good-behavior",
    "quick-study",
  ]);
});

test("Trainer Card movement does not resolve the destination board space", () => {
  const ctx = context([4, 5]);
  const started = startGame(ctx);
  const reordered: GameState = {
    ...started,
    domain: {
      ...started.domain,
      decks: {
        ...started.domain.decks,
        trainer: {
          ...(started.domain.decks.trainer ?? { id: "trainer", drawPile: [], discardPile: [], data: {} }),
          drawPile: ["training-bonus", ...K9_BLITZ_TRAINER_CARD_IDS.filter((id) => id !== "training-bonus")],
          discardPile: [],
        },
      },
    },
  };

  const result = executeCommand(reordered, {
    type: "ROLL_DICE",
    commandId: "training-bonus",
    actorPlayerId: "player-1",
    expectedRevision: reordered.revision,
  }, ctx);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const player = result.state.domain.players.find((candidate) => candidate.id === "player-1");
  assert.equal(player?.boardSpaceId, "space-10");
  assert.equal(player?.tokenIds.length, 1, "space 10 Paw Bonus must not resolve after card movement");
});

test("Trainer deck recycles in the same cyclic order after card 12", () => {
  const ctx = context([4, 5]);
  const started = startGame(ctx);
  const exhausted: GameState = {
    ...started,
    domain: {
      ...started.domain,
      decks: {
        ...started.domain.decks,
        trainer: {
          ...(started.domain.decks.trainer ?? { id: "trainer", drawPile: [], discardPile: [], data: {} }),
          drawPile: [],
          discardPile: [...K9_BLITZ_TRAINER_CARD_IDS],
        },
      },
    },
  };

  const result = executeCommand(exhausted, {
    type: "ROLL_DICE",
    commandId: "recycle-deck",
    actorPlayerId: "player-1",
    expectedRevision: exhausted.revision,
  }, ctx);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.domain.decks.trainer?.discardPile[0], "good-behavior");
  assert.equal(result.state.domain.decks.trainer?.drawPile[0], "quick-study");
});

test("Second Chance grants one immediate extra turn", () => {
  const ctx = context([4, 5]);
  const started = startGame(ctx);
  const reordered: GameState = {
    ...started,
    domain: {
      ...started.domain,
      decks: {
        ...started.domain.decks,
        trainer: {
          ...(started.domain.decks.trainer ?? { id: "trainer", drawPile: [], discardPile: [], data: {} }),
          drawPile: ["second-chance", ...K9_BLITZ_TRAINER_CARD_IDS.filter((id) => id !== "second-chance")],
          discardPile: [],
        },
      },
    },
  };

  const result = executeCommand(reordered, {
    type: "ROLL_DICE",
    commandId: "second-chance",
    actorPlayerId: "player-1",
    expectedRevision: reordered.revision,
  }, ctx);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.currentPlayerId, "player-1");
  assert.equal(result.state.turnNumber, 2);
  assert.equal(result.state.turn?.phase, "awaiting_roll");
});

test("Competition progress caps at eight", () => {
  const ctx = context([1, 1]);
  const started = startGame(ctx);
  const nearCap: GameState = {
    ...started,
    domain: {
      ...started.domain,
      players: started.domain.players.map((player) => player.id === "player-1"
        ? { ...player, data: { ...player.data, competition: 7 } }
        : player),
      competition: {
        ...started.domain.competition,
        participants: {
          ...started.domain.competition.participants,
          "player-1": { progress: 7 },
        },
      },
    },
  };

  const result = executeCommand(nearCap, {
    type: "ROLL_DICE",
    commandId: "competition-cap",
    actorPlayerId: "player-1",
    expectedRevision: nearCap.revision,
  }, ctx);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const player = result.state.domain.players.find((candidate) => candidate.id === "player-1");
  assert.equal(player?.boardSpaceId, "space-2");
  assert.equal(player?.data.competition, 8);
});

test("Vet Check never creates a negative Paw Token balance", () => {
  const ctx = context([1, 1]);
  const started = startGame(ctx);
  const positioned = replacePlayerSpace(started, "player-1", "space-17");
  const result = executeCommand(positioned, {
    type: "ROLL_DICE",
    commandId: "vet-zero",
    actorPlayerId: "player-1",
    expectedRevision: positioned.revision,
  }, ctx);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const player = result.state.domain.players.find((candidate) => candidate.id === "player-1");
  assert.equal(player?.boardSpaceId, "space-19");
  assert.equal(player?.tokenIds.length, 0);
});

test("movement clamps at Finish and first-to-Finish completes the game", () => {
  const ctx = context([6, 6]);
  const started = startGame(ctx);
  const nearFinish = replacePlayerSpace(started, "player-1", "space-65");
  const result = executeCommand(nearFinish, {
    type: "ROLL_DICE",
    commandId: "finish",
    actorPlayerId: "player-1",
    expectedRevision: nearFinish.revision,
  }, ctx);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.domain.players[0]?.boardSpaceId, "space-71");
  assert.equal(result.state.status, "completed");
  assert.equal(result.state.winner?.playerId, "player-1");
  assert.ok(result.events.some((event) => event.type === "GAME_COMPLETED"));
});

test("setup rejects unsupported player counts and duplicate seats", () => {
  assert.throws(() => createK9BlitzDigitalGameInput("solo", [
    { id: "solo", displayName: "Solo", seatIndex: 0 },
  ]), /2-4 players/);

  assert.throws(() => createK9BlitzDigitalGameInput("duplicate-seat", [
    { id: "one", displayName: "One", seatIndex: 0 },
    { id: "two", displayName: "Two", seatIndex: 0 },
  ]), /Seat indices must be unique/);
});
