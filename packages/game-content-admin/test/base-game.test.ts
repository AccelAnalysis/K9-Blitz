import assert from "node:assert/strict";
import test from "node:test";

import { BASE_CONTENT_CATALOG } from "../../../apps/web/game-data.js";
import {
  BASE_GAME_BOARD_SPACE_REGISTRY,
  BASE_GAME_CATALOG,
  BASE_GAME_CONTENT_PACK,
  BASE_GAME_RULESET,
  BASE_GAME_RULE_CAPABILITY_REGISTRY,
  BASE_GAME_WEB_CATALOG,
  InMemoryContentStore,
  validateForPublication,
} from "../src/index.ts";

test("owner-authorized base game is a complete publication-valid catalog", async () => {
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

  assert.equal(BASE_GAME_WEB_CATALOG.boardSpaces.length, 72);
  assert.equal(BASE_GAME_WEB_CATALOG.trainerCards.length, 12);
  assert.equal(BASE_GAME_WEB_CATALOG.dogs.length, 4);
  assert.equal(BASE_GAME_WEB_CATALOG.competitionIcons.length, 8);
  assert.ok(BASE_GAME_CONTENT_PACK.entities.length > 100);
  assert.deepEqual(BASE_GAME_RULESET.contentPacks, [{ id: BASE_GAME_CONTENT_PACK.id, revision: 1 }]);
});

test("GitHub Pages runtime catalog matches the published domain baseline", () => {
  assert.deepEqual(BASE_CONTENT_CATALOG, BASE_GAME_WEB_CATALOG);
});

test("base catalog ids are globally unique and every runtime board space is registered", () => {
  const ids = BASE_GAME_CATALOG.map((entity) => entity.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const space of BASE_GAME_WEB_CATALOG.boardSpaces) {
    assert.equal(BASE_GAME_BOARD_SPACE_REGISTRY.hasBoardSpace(space.id), true);
  }
});
