import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PresentationQueue } from "./presentationQueue.ts";

const dice = { id: "dice", stateRevision: 4, kind: "dice" as const, durationMs: 300 };
const pawn = { id: "pawn", stateRevision: 5, kind: "pawn" as const, durationMs: 500 };

describe("PresentationQueue", () => {
  it("serializes presentation work without becoming game state", () => {
    const queue = new PresentationQueue();
    queue.enqueue(dice, pawn);
    assert.deepEqual(queue.current(), dice);
    assert.equal(queue.pendingCount(), 2);
    assert.deepEqual(queue.completeCurrent(), pawn);
  });

  it("drops stale visual work when an authoritative newer revision arrives", () => {
    const queue = new PresentationQueue();
    queue.enqueue(dice, pawn);
    queue.recoverToRevision(5);
    assert.deepEqual(queue.current(), pawn);
    assert.equal(queue.pendingCount(), 1);
  });

  it("can be cleared safely", () => {
    const queue = new PresentationQueue();
    queue.enqueue(dice);
    queue.clear();
    assert.equal(queue.current(), undefined);
  });
});
