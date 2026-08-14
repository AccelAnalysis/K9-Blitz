import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clampZoom, focusSpace, fullBoardCamera } from "./camera.ts";

const space = { id: "s1", label: "Space 1", anchor: { x: 0.75, y: 0.25 }, kind: "track" as const, color: "blue" as const };

describe("camera helpers", () => {
  it("clamps camera zoom", () => {
    assert.equal(clampZoom(0.2), 1);
    assert.equal(clampZoom(9), 3.25);
  });

  it("centers a board space using canonical 0..1 normalized coordinates", () => {
    assert.deepEqual(focusSpace(space, 1000, 600, 2), {
      zoom: 2,
      panX: -500,
      panY: 300,
      following: true,
    });
  });

  it("returns a deterministic full-board camera", () => {
    assert.deepEqual(fullBoardCamera(), { zoom: 1, panX: 0, panY: 0, following: false });
  });
});
