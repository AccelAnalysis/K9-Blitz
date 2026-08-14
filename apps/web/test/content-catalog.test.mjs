import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BASE_CONTENT_CATALOG,
  BASE_CONTENT_VERSION,
  BASE_RULES_VERSION,
  validateContentCatalog,
} from "../game-data.js";

const canonical = JSON.parse(await readFile(new URL("../../../content/base-game/catalog.json", import.meta.url), "utf8"));

function browserEffects(effect) {
  switch (effect.type) {
    case "tokens": return [{ effectId: "GAIN_PAW_TOKENS", parameters: { amount: effect.amount } }];
    case "competition": return [{ effectId: "ADVANCE_COMPETITION", parameters: { amount: effect.amount } }];
    case "move": return [{ effectId: "MOVE", parameters: { amount: effect.amount, resolveDestination: false } }];
    case "extraTurn": return [{ effectId: "GRANT_EXTRA_TURN" }];
    case "combo": return [
      { effectId: "GAIN_PAW_TOKENS", parameters: { amount: effect.tokens } },
      { effectId: "ADVANCE_COMPETITION", parameters: { amount: effect.competition } },
    ];
    case "comboMove": return [
      { effectId: "MOVE", parameters: { amount: effect.move, resolveDestination: false } },
      { effectId: "GAIN_PAW_TOKENS", parameters: { amount: effect.tokens } },
    ];
    case "none": return [{ effectId: "NO_EFFECT" }];
    default: throw new Error(`Unsupported browser card effect ${effect.type}`);
  }
}

test("Pages baseline is valid and pinned to the canonical launch catalog", () => {
  assert.deepEqual(validateContentCatalog(BASE_CONTENT_CATALOG), []);
  assert.equal(BASE_RULES_VERSION, canonical.rulesVersion);
  assert.equal(BASE_CONTENT_VERSION, canonical.contentVersion);
  assert.deepEqual(
    BASE_CONTENT_CATALOG.dogs.map(({ id, name, breed }) => ({ id, name, breed })),
    canonical.dogs.map(({ id, name, breed }) => ({ id, name, breed })),
  );
  assert.deepEqual(
    BASE_CONTENT_CATALOG.trainerCards.map((card) => ({ id: card.id, title: card.title, effects: browserEffects(card.effect) })),
    canonical.trainerDeck.cards,
  );
  assert.equal(BASE_CONTENT_CATALOG.boardSpaces.length, canonical.board.spaceCount);
  for (const special of canonical.board.specialSpaces) {
    const index = Number(special.spaceId.slice("space-".length));
    assert.equal(BASE_CONTENT_CATALOG.boardSpaces[index]?.title, special.label);
  }
  assert.equal(BASE_CONTENT_CATALOG.competitionIcons.length, canonical.competitionTrack.maximumProgress);
});

test("catalog validator rejects rule semantics and effects unsupported by the current engine", () => {
  const invalidRules = structuredClone(BASE_CONTENT_CATALOG);
  invalidRules.digitalRules.victory = "most-tokens";
  assert.match(validateContentCatalog(invalidRules).join("\n"), /core settings are invalid/);

  const invalidCard = structuredClone(BASE_CONTENT_CATALOG);
  invalidCard.trainerCards[0].effect = { type: "execute-script" };
  assert.match(validateContentCatalog(invalidCard).join("\n"), /unsupported or incomplete effect/);
});
