import assert from "node:assert/strict";
import test from "node:test";

import {
  ContentAdministrationService,
  ContentValidationError,
  InMemoryAuditStore,
  InMemoryContentStore,
  hasPermission,
  type AdminActor,
  type ContentPackDefinition,
  type DogContentDefinition,
  type TrainerCardContentDefinition,
  type TrainerDeckContentDefinition,
} from "../src/index.ts";

const editor: AdminActor = { id: "editor-1", role: "content_editor" };
const publisher: AdminActor = { id: "publisher-1", role: "content_publisher" };

function harness() {
  const store = new InMemoryContentStore();
  const audit = new InMemoryAuditStore();
  let tick = 0;
  let id = 0;
  const capabilities = new Set([
    "trainer-card-effect:award-token",
    "board-space-resolver:vet-check",
    "competition-requirement:has-training",
    "reward-resolver:award-ribbon",
  ]);
  const service = new ContentAdministrationService({
    store,
    audit,
    clock: { now: () => `2026-08-13T21:34:${String(tick++).padStart(2, "0")}-04:00` },
    ids: { nextId: (prefix) => `${prefix}-${++id}` },
    rules: { hasCapability: (kind, capabilityId) => capabilities.has(`${kind}:${capabilityId}`) },
    boardSpaces: { hasBoardSpace: (spaceId) => ["space-1", "space-2"].includes(spaceId) },
  });
  return { store, audit, service };
}

function dogDraft(overrides: Partial<DogContentDefinition> = {}): Omit<
  DogContentDefinition,
  "status" | "revision" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> {
  return {
    id: "dog-luna",
    contentType: "dog",
    slug: "luna",
    title: "Luna",
    verificationStatus: "source-verified",
    tags: ["base-game"],
    runtime: {
      id: "dog-luna",
      name: "Luna",
      breed: "Corgi",
      attributes: {},
      skills: [],
      specialAbilityIds: [],
    },
    ...overrides,
  };
}

test("content editors can create and revise drafts but cannot publish them", async () => {
  const { service } = harness();
  const created = await service.createDraft<DogContentDefinition>(editor, dogDraft());
  assert.equal(created.revision, 1);
  assert.equal(created.status, "draft");

  const updated = await service.updateDraft<DogContentDefinition>(editor, created.id, { description: "Reference dog." });
  assert.equal(updated.revision, 2);
  assert.equal(updated.description, "Reference dog.");

  await assert.rejects(() => service.publish(editor, created.id), /does not have permission content:publish/);
});

test("published revisions remain immutable and editing requires an explicit new revision", async () => {
  const { service } = harness();
  await service.createDraft<DogContentDefinition>(editor, dogDraft());
  const published = await service.publish<DogContentDefinition>(publisher, "dog-luna");

  await assert.rejects(
    () => service.updateDraft<DogContentDefinition>(editor, "dog-luna", { title: "Changed" }),
    /start a new revision before editing/,
  );

  await service.startRevision<DogContentDefinition>(editor, "dog-luna");
  await service.updateDraft<DogContentDefinition>(editor, "dog-luna", { title: "Luna Revised" });
  const historical = await service.getPublishedRevision("dog-luna", published.revision);
  assert.equal(historical.title, "Luna");
});

test("unverified physical content cannot be published", async () => {
  const { service } = harness();
  await service.createDraft<DogContentDefinition>(editor, dogDraft({ verificationStatus: "unverified" }));
  await assert.rejects(
    () => service.publish(publisher, "dog-luna"),
    (error: unknown) => error instanceof ContentValidationError && /verificationStatus unverified/.test(error.message),
  );
});

test("runtime core definition id must match the versioned content id", async () => {
  const { service } = harness();
  await service.createDraft<DogContentDefinition>(editor, dogDraft({ runtime: { ...dogDraft().runtime, id: "different-id" } }));
  await assert.rejects(
    () => service.publish(publisher, "dog-luna"),
    (error: unknown) => error instanceof ContentValidationError && /runtime.id must equal/.test(error.message),
  );
});

test("Trainer Cards require a published deck and registered core effect IDs", async () => {
  const { service } = harness();
  await service.createDraft<TrainerCardContentDefinition>(editor, {
    id: "card-1",
    contentType: "trainer-card",
    slug: "card-1",
    title: "Source Verified Card",
    verificationStatus: "source-verified",
    tags: [],
    runtime: {
      id: "card-1",
      deckId: "missing-deck",
      title: "Source Verified Card",
      text: "Text from verified source.",
      effects: [{ effectId: "arbitrary-javascript" }],
    },
  });

  await assert.rejects(
    () => service.publish(publisher, "card-1"),
    (error: unknown) =>
      error instanceof ContentValidationError &&
      /missing content missing-deck/.test(error.message) &&
      /unsupported trainer-card-effect arbitrary-javascript/.test(error.message),
  );
});

test("Trainer Card publishes when its deck is published and effect is registered by core", async () => {
  const { service } = harness();
  const deck: Omit<TrainerDeckContentDefinition, "status" | "revision" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> = {
    id: "deck-blue",
    contentType: "trainer-deck",
    slug: "blue",
    title: "Blue Trainer Deck",
    verificationStatus: "source-verified",
    tags: [],
    deckId: "deck-blue",
  };
  await service.createDraft<TrainerDeckContentDefinition>(editor, deck);
  await service.publish(publisher, deck.id);

  await service.createDraft<TrainerCardContentDefinition>(editor, {
    id: "card-1",
    contentType: "trainer-card",
    slug: "card-1",
    title: "Verified Card",
    verificationStatus: "source-verified",
    tags: [],
    runtime: {
      id: "card-1",
      deckId: deck.id,
      title: "Verified Card",
      text: "Verified source text.",
      effects: [{ effectId: "award-token", parameters: { tokenId: "token-source" } }],
    },
  });

  const published = await service.publish<TrainerCardContentDefinition>(publisher, "card-1");
  assert.equal(published.status, "published");
});

test("content packs pin exact published revisions", async () => {
  const { service } = harness();
  await service.createDraft<DogContentDefinition>(editor, dogDraft());
  const dog = await service.publish<DogContentDefinition>(publisher, "dog-luna");

  await service.createDraft<ContentPackDefinition>(editor, {
    id: "base-pack",
    contentType: "content-pack",
    slug: "base-pack",
    title: "Base Pack",
    verificationStatus: "source-verified",
    tags: [],
    version: "0.1.0",
    compatibleRulesetIds: [],
    entities: [{ id: dog.id, revision: dog.revision }],
  });
  const pack = await service.publish<ContentPackDefinition>(publisher, "base-pack");

  await service.startRevision<DogContentDefinition>(editor, "dog-luna");
  await service.updateDraft<DogContentDefinition>(editor, "dog-luna", { title: "Later Draft" });

  assert.deepEqual(pack.entities, [{ id: dog.id, revision: dog.revision }]);
  const pinned = await service.getPublishedRevision(dog.id, dog.revision);
  assert.equal(pinned.title, "Luna");
});

test("audit history records lifecycle changes", async () => {
  const { service } = harness();
  await service.createDraft<DogContentDefinition>(editor, dogDraft());
  await service.updateDraft<DogContentDefinition>(editor, "dog-luna", { description: "Updated" });
  await service.publish(publisher, "dog-luna");

  const audit = await service.getAuditLog(publisher);
  assert.deepEqual(audit.map((entry) => entry.action), ["CONTENT_CREATED", "CONTENT_UPDATED", "CONTENT_PUBLISHED"]);
  assert.deepEqual(audit.map((entry) => entry.afterRevision), [1, 2, 3]);
});

test("player role is read-only", () => {
  assert.equal(hasPermission("player", "content:read"), true);
  assert.equal(hasPermission("player", "content:draft:write"), false);
  assert.equal(hasPermission("player", "content:publish"), false);
});
