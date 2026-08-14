import assert from "node:assert/strict";
import test from "node:test";

import {
  DIGITAL_BASE_BOARD_SPACES,
  DIGITAL_BASE_COMPETITION_TRACK,
  DIGITAL_BASE_DOGS,
  DIGITAL_BASE_RULES,
  DIGITAL_BASE_SPECIAL_SPACES,
  DIGITAL_BASE_TOKEN_INSTANCES,
  DIGITAL_BASE_TOKENS,
  DIGITAL_BASE_TRAINER_CARD_INSTANCES,
  DIGITAL_BASE_TRAINER_CARDS,
  DIGITAL_CONTENT_VERSION,
  DIGITAL_RULES_PROVENANCE,
  DIGITAL_RULES_VERSION,
  STANDARD_K9_BLITZ_DICE,
  awardDogAchievement,
  canCompleteCompetitionStage,
  collectTokens,
  completeCompetitionStage,
  completeDogTraining,
  createCompetitionTrackState,
  createCyclicTrainerDeck,
  createDogProgressState,
  createTokenBag,
  drawCyclicTrainerCard,
  drawToken,
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

test("v1 dice are two d6 summed and doubles have no authored bonus", () => {
  const result = rollDice(STANDARD_K9_BLITZ_DICE, sequenceRandom([0, 0.999999]));
  assert.deepEqual(result, {
    dice: [
      { dieId: "red-d6", value: 1 },
      { dieId: "white-d6", value: 6 },
    ],
    total: 7,
  });
  assert.equal(DIGITAL_BASE_RULES.movement.doubles, "no-extra-effect");
});

test("v1 trainer deck cycles forever in the documented authored order", () => {
  let deck = createCyclicTrainerDeck("trainer", DIGITAL_BASE_TRAINER_CARD_INSTANCES);
  const seen = [];
  for (let index = 0; index < DIGITAL_BASE_TRAINER_CARD_INSTANCES.length + 1; index += 1) {
    const draw = drawCyclicTrainerCard(deck);
    seen.push(draw.cardInstanceId);
    deck = draw.state;
  }
  assert.equal(seen[0], "trainer-good-behavior");
  assert.equal(seen[12], "trainer-good-behavior");
});

test("dog training and achievements remain idempotent", () => {
  const initial = createDogProgressState("luna", "player-1");
  const trained = completeDogTraining(completeDogTraining(initial, "obedience"), "obedience");
  const achieved = awardDogAchievement(awardDogAchievement(trained, "ribbon"), "ribbon");
  assert.deepEqual(achieved.completedTrainingIds, ["obedience"]);
  assert.deepEqual(achieved.achievementIds, ["ribbon"]);
});

test("digital component inventory contains finite Paw Token instances and bag draws without replacement", () => {
  const bag = createTokenBag(
    DIGITAL_BASE_TOKEN_INSTANCES,
    sequenceRandom(Array.from({ length: 23 }, () => 0)),
  );
  const first = drawToken(bag);
  const second = drawToken(first.state);
  assert.notEqual(first.tokenInstanceId, second.tokenInstanceId);
  assert.equal(second.state.remainingInstanceIds.length, 22);
  const inventory = collectTokens({}, "paw", 2);
  assert.deepEqual(spendTokens(inventory, "paw", 1), { paw: 1 });
});

test("complete 72-space mechanics overlay matches key named landing rules", () => {
  assert.equal(DIGITAL_BASE_BOARD_SPACES.length, 72);
  const vet = DIGITAL_BASE_BOARD_SPACES[19];
  const trainer = DIGITAL_BASE_BOARD_SPACES[22];
  const bonus = DIGITAL_BASE_BOARD_SPACES[25];
  assert.equal(getTriggeredSpaceActions(vet, "land")[0]?.resolverId, "SPEND_PAW_TOKENS");
  assert.equal(getTriggeredSpaceActions(trainer, "land")[0]?.resolverId, "DRAW_TRAINER_CARD");
  assert.equal(getTriggeredSpaceActions(bonus, "land")[0]?.resolverId, "GAIN_PAW_TOKENS");
});

test("competition stages enforce sequential prerequisites", () => {
  const initial = createCompetitionTrackState(DIGITAL_BASE_COMPETITION_TRACK);
  assert.equal(
    canCompleteCompetitionStage(DIGITAL_BASE_COMPETITION_TRACK, initial, "competition-2", new Set()),
    false,
  );
  const first = completeCompetitionStage(
    DIGITAL_BASE_COMPETITION_TRACK,
    initial,
    "competition-1",
    new Set(),
  );
  assert.equal(
    canCompleteCompetitionStage(DIGITAL_BASE_COMPETITION_TRACK, first, "competition-2", new Set()),
    true,
  );
});

test("published digital base catalog is complete and owner-authorized", () => {
  assert.equal(DIGITAL_RULES_VERSION, "k9-blitz-digital-1.0");
  assert.equal(DIGITAL_CONTENT_VERSION, "launch-1.0");
  assert.equal(DIGITAL_RULES_PROVENANCE.kind, "owner-authorized-digital-adaptation");
  assert.equal(DIGITAL_BASE_DOGS.length, 4);
  assert.equal(DIGITAL_BASE_TRAINER_CARDS.length, 12);
  assert.equal(DIGITAL_BASE_TOKENS.length, 1);
  assert.equal(DIGITAL_BASE_TOKEN_INSTANCES.length, 24);
  assert.equal(DIGITAL_BASE_COMPETITION_TRACK.stages.length, 8);
  assert.equal(DIGITAL_BASE_SPECIAL_SPACES.length, 20);
  assert.equal(DIGITAL_BASE_BOARD_SPACES.length, 72);
});
