import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { boardViewFromDefinition } from "./boardMap.ts";

const definition = {
  name: "Reference board",
  source: { assetPath: "assets/board-reference.svg" },
  spaces: [
    { id: "start", displayLabel: "START", kind: "start" as const, anchor: { x: 0.095, y: 0.852 }, confidence: "verified" as const, notes: "Known start region." },
  ],
};

describe("boardViewFromDefinition", () => {
  it("preserves canonical normalized coordinates and confidence", () => {
    const view = boardViewFromDefinition(definition, { artworkUrl: "/board.svg" });
    assert.equal(view.artworkUrl, "/board.svg");
    assert.deepEqual(view.spaces[0], {
      id: "start",
      label: "START",
      anchor: { x: 0.095, y: 0.852 },
      kind: "start",
      confidence: "verified",
      helpText: "Known start region.",
    });
  });

  it("does not invent artwork or pawns", () => {
    const view = boardViewFromDefinition(definition);
    assert.equal(view.artworkUrl, undefined);
    assert.deepEqual(view.pawns, []);
  });
});
