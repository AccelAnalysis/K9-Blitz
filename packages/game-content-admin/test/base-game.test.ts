import assert from "node:assert/strict";
import test from "node:test";
import {
  DIGITAL_BASE_BOARD_SPACES,
  DIGITAL_BASE_COMPETITION_TRACK,
  DIGITAL_BASE_DOGS,
  DIGITAL_BASE_TOKENS,
  DIGITAL_BASE_TRAINER_CARDS,
  DIGITAL_CONTENT_VERSION,
  DIGITAL_RULES_VERSION,
} from "../../core-game/src/baseGame.ts";
import {
  BASE_GAME_BOARD_CONTENT,
  BASE_GAME_BOARD_SPACE_REGISTRY,
  BASE_GAME_CATALOG,
  BASE_GAME_COMPETITION,
  BASE_GAME_CONTENT_PACK,
  BASE_GAME_DOG_CONTENT,
  BASE_GAME_RULE_CAPABILITY_REGISTRY,
  BASE_GAME_RULESET,
  BASE_GAME_TOKEN_CONTENT,
  BASE_GAME_TRAINER_CARD_CONTENT,
  InMemoryContentStore,
  validateForPublication,
} from "../src/index.ts";

test("published admin catalog wraps the canonical Digital Rules v1 component definitions", () => {
  assert.deepEqual(BASE_GAME_DOG_CONTENT.map((entry) => entry.runtime), DIGITAL_BASE_DOGS);
  assert.deepEqual(BASE_GAME_TRAINER_CARD_CONTENT.map((entry) => entry.runtime), DIGITAL_BASE_TRAINER_CARDS);
  assert.deepEqual(BASE_GAME_TOKEN_CONTENT.map((entry) => entry.runtime), DIGITAL_BASE_TOKENS);
  assert.deepEqual(BASE_GAME_BOARD_CONTENT.map((entry) => entry.runtime), DIGITAL_BASE_BOARD_SPACES);
  assert.deepEqual(BASE_GAME_COMPETITION.runtime, DIGITAL_BASE_COMPETITION_TRACK);
  assert.equal(BASE_GAME_RULESET.version, DIGITAL_RULES_VERSION);
  assert.equal(BASE_GAME_CONTENT_PACK.version, DIGITAL_CONTENT_VERSION);
});

test("complete base catalog satisfies strict publication validation", async () => {
  const store = new InMemoryContentStore();
  for (const entity of BASE_GAME_CATALOG) await store.put(entity);
  for (const entity of BASE_GAME_CATALOG) {
    await validateForPublication(entity, {
      store,
      rules: BASE_GAME_RULE_CAPABILITY_REGISTRY,
      boardSpaces: BASE_GAME_BOARD_SPACE_REGISTRY,
      policy: { minimumVerification: "qa-verified", requireConfirmedAssetRights: true },
    });
  }
  assert.equal(new Set(BASE_GAME_CATALOG.map((entity) => entity.id)).size, BASE_GAME_CATALOG.length);
  assert.equal(BASE_GAME_BOARD_CONTENT.length, 72);
  assert.deepEqual(BASE_GAME_RULESET.contentPacks, [{ id: BASE_GAME_CONTENT_PACK.id, revision: 1 }]);
});
