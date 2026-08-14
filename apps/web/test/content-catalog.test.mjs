import test from "node:test";
import assert from "node:assert/strict";
import {
  BASE_CONTENT_CATALOG,
  BASE_CONTENT_VERSION,
  BASE_RULES_VERSION,
  validateContentCatalog,
} from "../game-data.js";

test("published Pages content catalog is internally valid and version-pinned", () => {
  assert.deepEqual(validateContentCatalog(BASE_CONTENT_CATALOG), []);
  assert.equal(BASE_CONTENT_CATALOG.rulesVersion, BASE_RULES_VERSION);
  assert.equal(BASE_CONTENT_CATALOG.contentVersion, BASE_CONTENT_VERSION);
  assert.equal(BASE_CONTENT_CATALOG.digitalRules.id, BASE_RULES_VERSION);
  assert.equal(BASE_CONTENT_CATALOG.boardSpaces.length, 72);
  assert.equal(BASE_CONTENT_CATALOG.dogs.length, 4);
  assert.equal(BASE_CONTENT_CATALOG.trainerCards.length, 12);
  assert.equal(BASE_CONTENT_CATALOG.competitionIcons.length, 8);
});

test("catalog validator rejects unsupported rule configuration and effects", () => {
  const invalidRules = structuredClone(BASE_CONTENT_CATALOG);
  invalidRules.digitalRules.victory = "most-tokens";
  assert.match(validateContentCatalog(invalidRules).join("\n"), /core settings are invalid/);

  const invalidCard = structuredClone(BASE_CONTENT_CATALOG);
  invalidCard.trainerCards[0].effect = { type: "execute-script" };
  assert.match(validateContentCatalog(invalidCard).join("\n"), /unsupported or incomplete effect/);
});
