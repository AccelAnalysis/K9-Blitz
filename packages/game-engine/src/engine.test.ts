import assert from "node:assert/strict";
import test from "node:test";

import type {
  Clock,
  DomainState,
  GameState,
  RandomSource,
  RulesRuntime,
} from "./contracts.ts";
import { createGameState, executeCommand, getLegalActions } from "./engine.ts";
import { collectInvariantViolations } from "./invariants.ts";

class SequenceRandom implements RandomSource {
  #values: number[];

  constructor(values: number[]) {
    this.#values = [...values];
  }

  nextInt(minInclusive: number, maxInclusive: number): number {
    const value = this.#values.shift();
    if (value === undefined) throw new Error("SequenceRandom is exhausted.");
    assert.ok(value >= minInclusive && value <= maxInclusive);
    return value;
  }
}

class SequenceClock implements Clock {
  #tick = 0;

  now(): string {
    this.#tick += 1;
    return `2026-08-14T01:45:${String(this.#tick).padStart(2, "0")}.000Z`;
  }
}

const track = ["s0", "s1", "s2", "s3", "s4"] as const;

function fixtureRules(overrides: Partial<RulesRuntime> = {}): RulesRuntime {
  return {
    metadata: {
      id: "fixture-k9-rules",
      rulesVersion: "rules-0.1.0",
      contentVersion: "content-0.1.0",
      minPlayers: 2,
      maxPlayers: 4,
    },
    startSpaceId: "s0",
    turnPolicy: { endTurn: "manual" },

    rollDice(random) {
      const first = random.nextInt(1, 6);
      const second = random.nextInt(1, 6);
      return { dice: [first, second], total: first + second };
    },

    calculateMovement(state, playerId, dice) {
      const player = state.domain.players.find((candidate) => candidate.id === playerId);
      if (!player) throw new Error("unknown player");
      const fromIndex = track.indexOf(player.boardSpaceId as (typeof track)[number]);
      const toIndex = Math.min(track.length - 1, fromIndex + dice.total);
      const path = track.slice(fromIndex + 1, toIndex + 1);
      return {
        from: player.boardSpaceId,
        path,
        to: path.at(-1) ?? player.boardSpaceId,
        distance: path.length,
      };
    },

    getLandingEffects(_state, playerId, spaceId) {
      if (spaceId !== "s2") return [];
      return [{
        type: "CHOICE",
        targetPlayerId: playerId,
        promptKey: "fixture.choose.reward",
        source: { kind: "space", id: "s2" },
        options: [
          {
            id: "reward",
            labelKey: "fixture.reward",
            effects: [{
              type: "DOMAIN",
              effectType: "ADD_SCORE",
              targetPlayerId: playerId,
              payload: { amount: 1 },
              source: { kind: "space", id: "s2" },
            }],
          },
          { id: "skip", labelKey: "fixture.skip", effects: [] },
        ],
      }];
    },

    resolveDomainEffect(domain, effect, context) {
      if (effect.effectType !== "ADD_SCORE") throw new Error(`unsupported effect ${effect.effectType}`);
      const next = structuredClone(domain) as DomainState;
      const key = `score:${context.targetPlayerId}`;
      const prior = Number(next.extensions[key] ?? 0);
      const amount = Number(effect.payload.amount ?? 0);
      const extensions = { ...next.extensions, [key]: prior + amount };
      return {
        domain: { ...next, extensions },
        events: [{
          name: "SCORE_CHANGED",
          playerId: context.targetPlayerId,
          payload: { amount, total: prior + amount },
        }],
      };
    },

    evaluateVictory(state) {
      const winner = state.domain.players.find((player) => player.boardSpaceId === "s4");
      return winner
        ? { won: true, winner: { playerId: winner.id, dogId: winner.dogId, reason: "FIXTURE_FINISH" } }
        : { won: false };
    },

    ...overrides,
  };
}

function context(values: number[] = [1, 1], rules: RulesRuntime = fixtureRules()) {
  return { random: new SequenceRandom(values), clock: new SequenceClock(), rules };
}

function player(id: string, seatIndex: number) {
  return {
    id,
    displayName: id.toUpperCase(),
    seatIndex,
    dogId: null,
    cardIds: [],
    tokenIds: [],
    statuses: [],
    finished: false,
    data: {},
  };
}

function game(ctx = context()): GameState {
  return createGameState({
    gameId: "game-1",
    players: [player("p1", 0), player("p2", 1)],
  }, ctx);
}

function start(state: GameState, ctx: ReturnType<typeof context>) {
  return executeCommand(state, {
    type: "START_GAME",
    commandId: "start",
    actorPlayerId: "p1",
    expectedRevision: state.revision,
  }, ctx);
}

test("creates a JSON-serializable ready snapshot bound to exact rule and content versions", () => {
  const ctx = context();
  const state = game(ctx);
  assert.equal(state.status, "ready");
  assert.equal(state.revision, 0);
  assert.equal(state.rulesVersion, "rules-0.1.0");
  assert.equal(state.contentVersion, "content-0.1.0");
  assert.deepEqual(state.domain.players.map((entry) => entry.boardSpaceId), ["s0", "s0"]);
  assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
  assert.deepEqual(collectInvariantViolations(state), []);
});

test("start establishes one authoritative turn and increments revision exactly once", () => {
  const ctx = context();
  const result = start(game(ctx), ctx);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.state.revision, 1);
  assert.equal(result.state.status, "active");
  assert.equal(result.state.currentPlayerId, "p1");
  assert.equal(result.state.turn?.phase, "awaiting_roll");
  assert.equal(result.state.turnNumber, 1);
  assert.equal(result.state.roundNumber, 1);
  assert.deepEqual(result.events.map((event) => event.type), ["GAME_STARTED", "TURN_STARTED"]);
  assert.ok(result.events.every((event) => event.stateRevision === 1));
  assert.deepEqual(getLegalActions(result.state, "p1"), [{ type: "ROLL_DICE" }]);
  assert.deepEqual(getLegalActions(result.state, "p2"), []);
});

test("rejects stale commands without mutation or randomness consumption", () => {
  const ctx = context([6, 6]);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const rejected = executeCommand(started.state, {
    type: "ROLL_DICE",
    commandId: "stale",
    actorPlayerId: "p1",
    expectedRevision: 0,
  }, ctx);
  assert.equal(rejected.ok, false);
  if (rejected.ok) return;
  assert.equal(rejected.code, "STALE_STATE");
  assert.strictEqual(rejected.state, started.state);
});

test("rejects commands from a player who does not own the active turn", () => {
  const ctx = context([2, 2]);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const rejected = executeCommand(started.state, {
    type: "ROLL_DICE",
    commandId: "wrong-player",
    actorPlayerId: "p2",
    expectedRevision: 1,
  }, ctx);
  assert.equal(rejected.ok, false);
  if (rejected.ok) return;
  assert.equal(rejected.code, "NOT_CURRENT_PLAYER");
  assert.strictEqual(rejected.state, started.state);
});

test("records deterministic dice, full movement path, landing, and mandatory decision", () => {
  const ctx = context([1, 1]);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const rolled = executeCommand(started.state, {
    type: "ROLL_DICE",
    commandId: "roll",
    actorPlayerId: "p1",
    expectedRevision: 1,
  }, ctx);
  assert.equal(rolled.ok, true);
  if (!rolled.ok) return;

  assert.equal(rolled.state.revision, 2);
  assert.deepEqual(rolled.state.turn?.dice, { dice: [1, 1], total: 2 });
  assert.deepEqual(rolled.state.turn?.movement, {
    from: "s0",
    path: ["s1", "s2"],
    to: "s2",
    distance: 2,
  });
  assert.equal(rolled.state.domain.players[0]?.boardSpaceId, "s2");
  assert.equal(rolled.state.turn?.phase, "awaiting_decision");
  assert.equal(rolled.state.turn?.canEndTurn, false);
  assert.deepEqual(rolled.events.map((event) => event.type), [
    "DICE_ROLLED",
    "PAWN_MOVED",
    "SPACE_LANDED",
    "DECISION_REQUESTED",
  ]);
  assert.deepEqual(getLegalActions(rolled.state, "p1")[0]?.optionIds, ["reward", "skip"]);
});

test("choice resolution drains follow-up domain effects before end-turn becomes legal", () => {
  const ctx = context([1, 1]);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const rolled = executeCommand(started.state, {
    type: "ROLL_DICE", commandId: "roll", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(rolled.ok, true);
  if (!rolled.ok) return;
  const effectId = rolled.state.turn?.pendingDecisionEffectId;
  assert.ok(effectId);

  const chosen = executeCommand(rolled.state, {
    type: "CHOOSE_OPTION",
    commandId: "choice",
    actorPlayerId: "p1",
    expectedRevision: 2,
    effectId,
    optionId: "reward",
  }, ctx);
  assert.equal(chosen.ok, true);
  if (!chosen.ok) return;

  assert.equal(chosen.state.revision, 3);
  assert.equal(chosen.state.domain.extensions["score:p1"], 1);
  assert.equal(chosen.state.pendingEffects.length, 0);
  assert.equal(chosen.state.turn?.phase, "awaiting_turn_end");
  assert.deepEqual(getLegalActions(chosen.state, "p1"), [{ type: "END_TURN" }]);
  assert.deepEqual(chosen.events.map((event) => event.type), [
    "DECISION_RESOLVED",
    "RULE_EFFECT_APPLIED",
    "DOMAIN_EVENT",
  ]);
});

test("turn controller advances players and rounds without UI-owned turn state", () => {
  const rules = fixtureRules({ getLandingEffects: () => [] });
  const ctx = context([1, 2, 1, 2], rules);
  let state = game(ctx);

  const startResult = start(state, ctx);
  assert.equal(startResult.ok, true);
  if (!startResult.ok) return;
  state = startResult.state;

  const p1Roll = executeCommand(state, {
    type: "ROLL_DICE", commandId: "p1-roll", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(p1Roll.ok, true);
  if (!p1Roll.ok) return;
  state = p1Roll.state;

  const p1End = executeCommand(state, {
    type: "END_TURN", commandId: "p1-end", actorPlayerId: "p1", expectedRevision: 2,
  }, ctx);
  assert.equal(p1End.ok, true);
  if (!p1End.ok) return;
  state = p1End.state;
  assert.equal(state.currentPlayerId, "p2");
  assert.equal(state.turnNumber, 2);
  assert.equal(state.roundNumber, 1);

  const p2Roll = executeCommand(state, {
    type: "ROLL_DICE", commandId: "p2-roll", actorPlayerId: "p2", expectedRevision: 3,
  }, ctx);
  assert.equal(p2Roll.ok, true);
  if (!p2Roll.ok) return;
  state = p2Roll.state;

  const p2End = executeCommand(state, {
    type: "END_TURN", commandId: "p2-end", actorPlayerId: "p2", expectedRevision: 4,
  }, ctx);
  assert.equal(p2End.ok, true);
  if (!p2End.ok) return;
  assert.equal(p2End.state.currentPlayerId, "p1");
  assert.equal(p2End.state.turnNumber, 3);
  assert.equal(p2End.state.roundNumber, 2);
});

test("duplicate command IDs can never apply the same mutation twice", () => {
  const rules = fixtureRules({ getLandingEffects: () => [] });
  const ctx = context([1, 2], rules);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const rolled = executeCommand(started.state, {
    type: "ROLL_DICE", commandId: "roll-once", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(rolled.ok, true);
  if (!rolled.ok) return;

  const duplicate = executeCommand(rolled.state, {
    type: "ROLL_DICE", commandId: "roll-once", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(duplicate.ok, false);
  if (duplicate.ok) return;
  assert.equal(duplicate.code, "COMMAND_ALREADY_PROCESSED");
  assert.strictEqual(duplicate.state, rolled.state);
  assert.equal(duplicate.state.revision, 2);
});

test("victory is atomic and locks normal gameplay", () => {
  const rules = fixtureRules({ getLandingEffects: () => [] });
  const ctx = context([2, 2], rules);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const rolled = executeCommand(started.state, {
    type: "ROLL_DICE", commandId: "winning-roll", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(rolled.ok, true);
  if (!rolled.ok) return;

  assert.equal(rolled.state.status, "completed");
  assert.equal(rolled.state.currentPlayerId, null);
  assert.equal(rolled.state.winner?.playerId, "p1");
  assert.equal(rolled.state.turn?.phase, "turn_complete");
  assert.equal(rolled.events.at(-1)?.type, "GAME_COMPLETED");
  assert.deepEqual(getLegalActions(rolled.state, "p1"), []);

  const afterWin = executeCommand(rolled.state, {
    type: "END_TURN", commandId: "after-win", actorPlayerId: "p1", expectedRevision: 2,
  }, ctx);
  assert.equal(afterWin.ok, false);
  if (afterWin.ok) return;
  assert.equal(afterWin.code, "GAME_ALREADY_COMPLETE");
});

test("pause and resume preserve the exact active turn", () => {
  const ctx = context();
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const paused = executeCommand(started.state, {
    type: "PAUSE_GAME", commandId: "pause", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(paused.ok, true);
  if (!paused.ok) return;
  assert.equal(paused.state.status, "paused");
  assert.equal(paused.state.turn?.phase, "awaiting_roll");

  const blocked = executeCommand(paused.state, {
    type: "ROLL_DICE", commandId: "blocked", actorPlayerId: "p1", expectedRevision: 2,
  }, ctx);
  assert.equal(blocked.ok, false);
  if (blocked.ok) return;
  assert.equal(blocked.code, "GAME_NOT_ACTIVE");

  const resumed = executeCommand(paused.state, {
    type: "RESUME_GAME", commandId: "resume", actorPlayerId: "p1", expectedRevision: 2,
  }, ctx);
  assert.equal(resumed.ok, true);
  if (!resumed.ok) return;
  assert.equal(resumed.state.status, "active");
  assert.equal(resumed.state.turn?.phase, "awaiting_roll");
});

test("card and token instances cannot exist in multiple authoritative locations", () => {
  const ctx = context();
  const state = createGameState({
    gameId: "inventory-game",
    players: [player("p1", 0), player("p2", 1)],
    decks: { trainer: { id: "trainer", drawPile: ["card-1"], discardPile: [], data: {} } },
    tokens: { bag: ["token-1"], discarded: [], removed: [], data: {} },
  }, ctx);

  const corrupted = structuredClone(state) as GameState;
  const first = corrupted.domain.players[0];
  assert.ok(first);
  (first.cardIds as string[]).push("card-1");
  (first.tokenIds as string[]).push("token-1");
  const violations = collectInvariantViolations(corrupted);
  assert.ok(violations.some((message) => message.includes("card card-1 exists in multiple locations")));
  assert.ok(violations.some((message) => message.includes("token token-1 exists in multiple locations")));
});

test("JSON-restored state resumes from the exact saved turn phase", () => {
  const ctx = context([1, 1]);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;
  const restored = JSON.parse(JSON.stringify(started.state)) as GameState;
  const rolled = executeCommand(restored, {
    type: "ROLL_DICE", commandId: "roll-restored", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(rolled.ok, true);
  if (!rolled.ok) return;
  assert.equal(rolled.state.turn?.phase, "awaiting_decision");
});

test("saved games reject a different rules version", () => {
  const originalContext = context();
  const state = game(originalContext);
  const changedRules = fixtureRules({
    metadata: {
      id: "fixture-k9-rules",
      rulesVersion: "rules-0.2.0",
      contentVersion: "content-0.1.0",
      minPlayers: 2,
      maxPlayers: 4,
    },
  });
  const changedContext = context([], changedRules);
  const result = executeCommand(state, {
    type: "START_GAME", commandId: "start-new-rules", actorPlayerId: "p1", expectedRevision: 0,
  }, changedContext);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "RULESET_MISMATCH");
});

test("saved games reject a different content version", () => {
  const originalContext = context();
  const state = game(originalContext);
  const changedRules = fixtureRules({
    metadata: {
      id: "fixture-k9-rules",
      rulesVersion: "rules-0.1.0",
      contentVersion: "content-0.2.0",
      minPlayers: 2,
      maxPlayers: 4,
    },
  });
  const changedContext = context([], changedRules);
  const result = executeCommand(state, {
    type: "START_GAME", commandId: "start-new-content", actorPlayerId: "p1", expectedRevision: 0,
  }, changedContext);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "RULESET_MISMATCH");
});

test("a rule adapter that returns corrupt physical state is rejected atomically", () => {
  const corruptRules = fixtureRules({
    getLandingEffects(_state, playerId) {
      return [{
        type: "DOMAIN",
        effectType: "CORRUPT",
        targetPlayerId: playerId,
        payload: {},
      }];
    },
    resolveDomainEffect(domain) {
      const corrupted = structuredClone(domain);
      const deck = { id: "trainer", drawPile: ["card-1"], discardPile: [], data: {} };
      const players = corrupted.players.map((entry, index) => index === 0
        ? { ...entry, cardIds: ["card-1"] }
        : entry);
      return { domain: { ...corrupted, decks: { trainer: deck }, players } };
    },
    evaluateVictory() {
      return { won: false };
    },
  });
  const ctx = context([1, 1], corruptRules);
  const started = start(game(ctx), ctx);
  assert.equal(started.ok, true);
  if (!started.ok) return;

  const result = executeCommand(started.state, {
    type: "ROLL_DICE", commandId: "corrupt", actorPlayerId: "p1", expectedRevision: 1,
  }, ctx);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, "STATE_INVARIANT_VIOLATION");
  assert.strictEqual(result.state, started.state);
  assert.equal(result.state.revision, 1);
});

test("accepted commands do not mutate their input snapshots", () => {
  const rules = fixtureRules({ getLandingEffects: () => [] });
  const ctx = context([1, 2], rules);
  const initial = game(ctx);
  const initialCopy = structuredClone(initial);
  const started = start(initial, ctx);
  assert.equal(started.ok, true);
  assert.deepEqual(initial, initialCopy);
  assert.equal(initial.revision, 0);
});
