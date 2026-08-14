import assert from "node:assert/strict";
import test from "node:test";

import {
  boardToViewport,
  K9_BLITZ_REFERENCE_BOARD,
  layoutPawnsOnSpace,
  normalizePixels,
  validateBoardTopology,
  walkBoard,
} from "../dist/index.js";

test("reference board validates without dangling topology", () => {
  assert.deepEqual(validateBoardTopology(K9_BLITZ_REFERENCE_BOARD), []);
});

test("pixel coordinates normalize against the board dimensions", () => {
  assert.deepEqual(normalizePixels(800, 450, 1600, 900), { x: 0.5, y: 0.5 });
});

test("normalized coordinates survive viewport scaling and translation", () => {
  assert.deepEqual(
    boardToViewport(
      { x: 0.5, y: 0.25 },
      { width: 1600, height: 900, zoom: 2, offsetX: 10, offsetY: 20 },
    ),
    { x: 1610, y: 470 },
  );
});

test("co-located pawns receive stable non-overlapping positions", () => {
  const start = K9_BLITZ_REFERENCE_BOARD.spaces.find((space) => space.id === "start");
  assert.ok(start);

  const pawns = layoutPawnsOnSpace(start, [
    { id: "p3", playerId: "3", color: "green", spaceId: "start" },
    { id: "p1", playerId: "1", color: "red", spaceId: "start" },
    { id: "p2", playerId: "2", color: "blue", spaceId: "start" },
  ]);

  assert.equal(pawns.length, 3);
  assert.equal(new Set(pawns.map((pawn) => `${pawn.position.x}:${pawn.position.y}`)).size, 3);
  assert.deepEqual(pawns.map((pawn) => pawn.id), ["p1", "p2", "p3"]);
});

test("walkBoard refuses to invent a rule at a branch", () => {
  const fixture = {
    ...K9_BLITZ_REFERENCE_BOARD,
    spaces: [
      { ...K9_BLITZ_REFERENCE_BOARD.spaces[0], id: "a", next: ["b", "c"], previous: [] },
      { ...K9_BLITZ_REFERENCE_BOARD.spaces[0], id: "b", next: [], previous: ["a"] },
      { ...K9_BLITZ_REFERENCE_BOARD.spaces[0], id: "c", next: [], previous: ["a"] },
    ],
    startSpaceId: "a",
    finishSpaceId: undefined,
  };

  assert.throws(() => walkBoard(fixture, "a", 1), /ambiguous/);
});
