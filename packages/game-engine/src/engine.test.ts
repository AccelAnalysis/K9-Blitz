import assert from "node:assert/strict";
import test from "node:test";

import type { GameState } from "./contracts.ts";
import { executeCommand } from "./engine.ts";
import type { RandomSource } from "./random.ts";

class SequenceRandom implements RandomSource {
  #values: number[];

  constructor(values: number[]) {
    this.#values = [...values];
  }

  nextInt(): number {
    const value = this.#values.shift();
    if (value === undefined) throw new Error("SequenceRandom is exhausted.");
    return value;
  }
}

function activeState(overrides: Partial<GameState> = {}): GameState {
  return {
    gameId: "game-1",
    rulesVersion: "unassigned",
    contentVersion: "unassigned",
    revision: 7,
    status: "active",
    currentPlayerId: "player-1",
    turn: { number: 3, phase: "awaiting_roll" },
    players: [
      { id: "player-1", displayName: "Player One", boardSpaceId: null },
      { id: "player-2", displayName: "Player Two", boardSpaceId: null },
    ],
    processedCommandIds: [],
    ...overrides,
  };
}

test("records injected dice results deterministically without inventing movement rules", () => {
  const state = activeState();
  const result = executeCommand(state, {
    type: "ROLL_DICE",
    commandId: "cmd-1",
    actorPlayerId: "player-1",
    expectedRevision: 7,
  }, { random: new SequenceRandom([3, 4]) });

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.state.revision, 8);
  assert.equal(result.state.turn.phase, "roll_resolved");
  assert.deepEqual(result.events, [{
    type: "DICE_ROLLED",
    commandId: "cmd-1",
    playerId: "player-1",
    dice: [3, 4],
    total: 7,
    stateRevision: 8,
  }]);
  assert.equal(result.state.players[0]?.boardSpaceId, null);
});

test("rejects stale commands without mutating state", () => {
  const state = activeState();
  const result = executeCommand(state, {
    type: "ROLL_DICE",
    commandId: "cmd-stale",
    actorPlayerId: "player-1",
    expectedRevision: 6,
  }, { random: new SequenceRandom([1, 1]) });

  assert.deepEqual(result, {
    ok: false,
    code: "STALE_STATE",
    message: "Expected revision 6; current revision is 7.",
    state,
  });
});

test("rejects a command from a player who does not own the turn", () => {
  const state = activeState();
  const result = executeCommand(state, {
    type: "ROLL_DICE",
    commandId: "cmd-wrong-player",
    actorPlayerId: "player-2",
    expectedRevision: 7,
  }, { random: new SequenceRandom([2, 2]) });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "NOT_CURRENT_PLAYER");
  assert.strictEqual(result.state, state);
});

test("prevents a processed command from executing twice", () => {
  const state = activeState({ processedCommandIds: ["cmd-1"] });
  const result = executeCommand(state, {
    type: "ROLL_DICE",
    commandId: "cmd-1",
    actorPlayerId: "player-1",
    expectedRevision: 7,
  }, { random: new SequenceRandom([6, 6]) });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "COMMAND_ALREADY_PROCESSED");
  assert.strictEqual(result.state, state);
});

test("rejects rolling when the turn is not awaiting a roll", () => {
  const state = activeState({ turn: { number: 3, phase: "roll_resolved" } });
  const result = executeCommand(state, {
    type: "ROLL_DICE",
    commandId: "cmd-phase",
    actorPlayerId: "player-1",
    expectedRevision: 7,
  }, { random: new SequenceRandom([5, 5]) });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "ACTION_NOT_ALLOWED");
});
