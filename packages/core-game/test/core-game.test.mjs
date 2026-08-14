import assert from "node:assert/strict";
import test from "node:test";

import {
  STANDARD_K9_BLITZ_DICE,
  awardDogAchievement,
  canCompleteCompetitionStage,
  collectTokens,
  completeCompetitionStage,
  completeDogTraining,
  createCompetitionTrackState,
  createDogProgressState,
  createTokenBag,
  createTrainerDeck,
  discardTrainerCard,
  drawToken,
  drawTrainerCard,
  getTriggeredSpaceActions,
  rollDice,
  spendTokens,
} from "../dist/index.js";

function sequenceRandom(values) {
  let index = 0;
  return {
    next() {
      const value = values[index];
      index += 1;
      if (value === undefined) throw new Error("Random sequence exhausted");
      return value;
    },
  };
}

test("standard dice use deterministic injected randomness and preserve each die result", () => {
  const result = rollDice(STANDARD_K9_BLITZ_DICE, sequenceRandom([0, 0.999999]));
  assert.deepEqual(result, {
    dice: [
      { dieId: "red-d6", value: 1 },
      { dieId: "white-d6", value: 6 },
    ],
    total: 7,
  });
});

test("trainer deck draws finite card instances and only discards drawn cards", () => {
  const deck = createTrainerDeck(
    "trainer",
    [
      { instanceId: "card-a", definitionId: "good-behavior" },
      { instanceId: "card-b", definitionId: "good-behavior" },
    ],
    sequenceRandom([0]),
  );

  const draw = drawTrainerCard(deck);
  assert.equal(draw.state.drawPile.length, 1);
  const discarded = discardTrainerCard(draw.state, draw.cardInstanceId);
  assert.deepEqual(discarded.discardPile, [draw.cardInstanceId]);
  assert.throws(() => discardTrainerCard(discarded, draw.cardInstanceId), /must be outside the deck/);
});

test("dog training and achievements are idempotent", () => {
  const initial = createDogProgressState("luna", "player-1");
  const trained = completeDogTraining(completeDogTraining(initial, "obedience"), "obedience");
  const achieved = awardDogAchievement(awardDogAchievement(trained, "ribbon"), "ribbon");

  assert.deepEqual(achieved.completedTrainingIds, ["obedience"]);
  assert.deepEqual(achieved.achievementIds, ["ribbon"]);
});

test("token bag draws without replacement and inventory cannot overspend", () => {
  const bag = createTokenBag(
    [
      { instanceId: "paw-1", definitionId: "paw" },
      { instanceId: "paw-2", definitionId: "paw" },
    ],
    sequenceRandom([0]),
  );
  const first = drawToken(bag);
  const second = drawToken(first.state);

  assert.notEqual(first.tokenInstanceId, second.tokenInstanceId);
  assert.equal(second.state.remainingInstanceIds.length, 0);
  assert.throws(() => drawToken(second.state), /token bag is empty/i);

  const inventory = collectTokens({}, "paw", 2);
  assert.deepEqual(spendTokens(inventory, "paw", 1), { paw: 1 });
  assert.throws(() => spendTokens(inventory, "paw", 3), /Cannot spend/);
});

test("space mechanics return only actions for the active trigger", () => {
  const actions = getTriggeredSpaceActions(
    {
      spaceId: "vet-check",
      actions: [
        { id: "land-vet", label: "Vet Check", trigger: "land", resolverId: "VET_CHECK" },
        { id: "pass-vet", label: "Pass Vet", trigger: "pass", resolverId: "VET_PASS" },
      ],
    },
    "land",
  );
  assert.deepEqual(actions.map((action) => action.id), ["land-vet"]);
});

test("competition stages are definition-driven and enforce configured prerequisites and requirements", () => {
  const definition = {
    id: "central-track",
    stages: [
      {
        id: "stage-a",
        label: "Stage A",
        prerequisiteStageIds: [],
        requirementIds: ["req-a"],
        rewardIds: [],
      },
      {
        id: "stage-b",
        label: "Stage B",
        prerequisiteStageIds: ["stage-a"],
        requirementIds: ["req-b"],
        rewardIds: [],
      },
    ],
  };

  const initial = createCompetitionTrackState(definition);
  assert.equal(canCompleteCompetitionStage(definition, initial, "stage-b", new Set(["req-b"])), false);
  const afterA = completeCompetitionStage(definition, initial, "stage-a", new Set(["req-a"]));
  assert.equal(canCompleteCompetitionStage(definition, afterA, "stage-b", new Set(["req-b"])), true);
});
