import type { BoardSpaceRegistry, ContentStore, RuleCapabilityRegistry } from "./ports.ts";
import type {
  CatalogEntity,
  ContentPackDefinition,
  ContentRef,
  MediaAssetDefinition,
  RuleCapabilityKind,
  RulesetDefinition,
} from "./types.ts";

export interface PublicationPolicy {
  minimumVerification: "source-verified" | "qa-verified";
  requireConfirmedAssetRights: boolean;
}

export interface ValidationDependencies {
  store: ContentStore;
  rules: RuleCapabilityRegistry;
  boardSpaces?: BoardSpaceRegistry;
  policy?: Partial<PublicationPolicy>;
}

const DEFAULT_POLICY: PublicationPolicy = {
  minimumVerification: "source-verified",
  requireConfirmedAssetRights: false,
};

export class ContentValidationError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(`Content validation failed:\n- ${problems.join("\n- ")}`);
    this.name = "ContentValidationError";
    this.problems = problems;
  }
}

function capabilityProblems(
  rules: RuleCapabilityRegistry,
  kind: RuleCapabilityKind,
  capabilityId: string,
  path: string,
): string[] {
  return rules.hasCapability(kind, capabilityId)
    ? []
    : [`${path} references unsupported ${kind} ${capabilityId}.`];
}

async function requireLatestEntity(
  store: ContentStore,
  id: string,
  expectedType: CatalogEntity["contentType"] | undefined,
  path: string,
  publishedOnly = true,
): Promise<string[]> {
  const entity = await store.getLatest(id);
  if (!entity) return [`${path} references missing content ${id}.`];
  if (expectedType && entity.contentType !== expectedType) {
    return [`${path} references ${id} as ${expectedType}, but it is ${entity.contentType}.`];
  }
  if (entity.status === "retired") return [`${path} references retired content ${id}.`];
  if (publishedOnly && entity.status !== "published") {
    return [`${path} references ${id}, but its latest revision is ${entity.status}, not published.`];
  }
  return [];
}

async function requirePublishedRef(store: ContentStore, ref: ContentRef, path: string): Promise<string[]> {
  const entity = await store.getRevision(ref);
  if (!entity) return [`${path} references missing revision ${ref.id}@${ref.revision}.`];
  if (entity.status !== "published") {
    return [`${path} must reference a published revision; ${ref.id}@${ref.revision} is ${entity.status}.`];
  }
  return [];
}

function verificationMeetsPolicy(entity: CatalogEntity, policy: PublicationPolicy): boolean {
  if (policy.minimumVerification === "source-verified") {
    return entity.verificationStatus === "source-verified" || entity.verificationStatus === "qa-verified";
  }
  return entity.verificationStatus === "qa-verified";
}

async function validateMediaAssets(
  store: ContentStore,
  assetIds: readonly string[],
  policy: PublicationPolicy,
  path: string,
): Promise<string[]> {
  const problems: string[] = [];
  for (const assetId of assetIds) {
    problems.push(...(await requireLatestEntity(store, assetId, "media-asset", path)));
    const asset = await store.getLatest(assetId);
    if (
      policy.requireConfirmedAssetRights &&
      asset?.contentType === "media-asset" &&
      (asset as MediaAssetDefinition).rightsStatus === "unknown"
    ) {
      problems.push(`${path} references asset ${assetId} with unknown rights status.`);
    }
  }
  return problems;
}

async function validateContentPack(entity: ContentPackDefinition, store: ContentStore): Promise<string[]> {
  const problems: string[] = [];
  if (!entity.version.trim()) problems.push("content-pack.version is required.");
  if (!entity.entities.length) problems.push("content-pack.entities must contain at least one published content revision.");
  for (const ref of entity.entities) {
    problems.push(...(await requirePublishedRef(store, ref, `content-pack.entities[${ref.id}]`)));
  }
  return problems;
}

async function validateRuleset(entity: RulesetDefinition, store: ContentStore): Promise<string[]> {
  const problems: string[] = [];
  if (!entity.version.trim()) problems.push("ruleset.version is required.");
  if (!entity.contentPacks.length) problems.push("ruleset.contentPacks must contain at least one published content pack.");
  for (const ref of entity.contentPacks) {
    problems.push(...(await requirePublishedRef(store, ref, `ruleset.contentPacks[${ref.id}]`)));
    const target = await store.getRevision(ref);
    if (target && target.contentType !== "content-pack") {
      problems.push(`ruleset.contentPacks[${ref.id}] must reference content-pack content, not ${target.contentType}.`);
    }
  }
  return problems;
}

export async function validateForPublication(
  entity: CatalogEntity,
  dependencies: ValidationDependencies,
): Promise<void> {
  const { store, rules, boardSpaces } = dependencies;
  const policy: PublicationPolicy = { ...DEFAULT_POLICY, ...dependencies.policy };
  const problems: string[] = [];

  if (!entity.id.trim()) problems.push("id is required.");
  if (!entity.slug.trim()) problems.push("slug is required.");
  if (!entity.title.trim()) problems.push("title is required.");
  if (!verificationMeetsPolicy(entity, policy)) {
    problems.push(`verificationStatus ${entity.verificationStatus} does not satisfy publication policy ${policy.minimumVerification}.`);
  }

  switch (entity.contentType) {
    case "dog": {
      if (entity.runtime.id !== entity.id) problems.push("dog.runtime.id must equal the content id.");
      const skillIds = entity.runtime.skills.map((skill) => skill.id);
      if (new Set(skillIds).size !== skillIds.length) problems.push("dog.runtime.skills contains duplicate skill ids.");
      for (const abilityId of entity.runtime.specialAbilityIds) {
        problems.push(...capabilityProblems(rules, "dog-special-ability", abilityId, "dog.runtime.specialAbilityIds"));
      }
      const assetIds = [
        entity.runtime.portraitAssetId,
        entity.runtime.cardFrontAssetId,
        entity.runtime.cardBackAssetId,
      ].filter((value): value is string => value !== undefined);
      problems.push(...(await validateMediaAssets(store, assetIds, policy, "dog.runtime artwork")));
      break;
    }

    case "trainer-deck":
      if (entity.deckId !== entity.id) problems.push("trainer-deck.deckId must equal the content id.");
      problems.push(
        ...(await validateMediaAssets(
          store,
          entity.cardBackAssetId ? [entity.cardBackAssetId] : [],
          policy,
          "trainer-deck.cardBackAssetId",
        )),
      );
      break;

    case "trainer-card": {
      if (entity.runtime.id !== entity.id) problems.push("trainer-card.runtime.id must equal the content id.");
      problems.push(
        ...(await requireLatestEntity(store, entity.runtime.deckId, "trainer-deck", "trainer-card.runtime.deckId")),
      );
      for (const effect of entity.runtime.effects) {
        problems.push(...capabilityProblems(rules, "trainer-card-effect", effect.effectId, "trainer-card.runtime.effects"));
      }
      const assetIds = [entity.runtime.frontAssetId, entity.runtime.backAssetId].filter(
        (value): value is string => value !== undefined,
      );
      problems.push(...(await validateMediaAssets(store, assetIds, policy, "trainer-card.runtime artwork")));
      break;
    }

    case "token":
      if (entity.runtime.id !== entity.id) problems.push("token.runtime.id must equal the content id.");
      problems.push(
        ...(await validateMediaAssets(
          store,
          entity.runtime.iconAssetId ? [entity.runtime.iconAssetId] : [],
          policy,
          "token.runtime.iconAssetId",
        )),
      );
      break;

    case "board-space-content": {
      if (entity.runtime.spaceId !== entity.id) problems.push("board-space-content.runtime.spaceId must equal the content id.");
      if (boardSpaces && !boardSpaces.hasBoardSpace(entity.runtime.spaceId)) {
        problems.push(`board-space-content references unknown board space ${entity.runtime.spaceId}.`);
      }
      const actionIds = entity.runtime.actions.map((action) => action.id);
      if (new Set(actionIds).size !== actionIds.length) problems.push("board-space-content.runtime.actions contains duplicate ids.");
      for (const action of entity.runtime.actions) {
        problems.push(
          ...capabilityProblems(rules, "board-space-resolver", action.resolverId, `board-space-content action ${action.id}`),
        );
      }
      if (entity.helpContentId) {
        problems.push(...(await requireLatestEntity(store, entity.helpContentId, "help", "board-space-content.helpContentId")));
      }
      problems.push(
        ...(await validateMediaAssets(
          store,
          entity.artworkAssetId ? [entity.artworkAssetId] : [],
          policy,
          "board-space-content.artworkAssetId",
        )),
      );
      break;
    }

    case "challenge":
      if (entity.instructionHelpContentId) {
        problems.push(...(await requireLatestEntity(store, entity.instructionHelpContentId, "help", "challenge.instructionHelpContentId")));
      }
      problems.push(...capabilityProblems(rules, "challenge-resolver", entity.resolverId, "challenge.resolverId"));
      break;

    case "reward":
      problems.push(...capabilityProblems(rules, "reward-resolver", entity.resolverId, "reward.resolverId"));
      break;

    case "penalty":
      problems.push(...capabilityProblems(rules, "penalty-resolver", entity.resolverId, "penalty.resolverId"));
      break;

    case "competition": {
      if (entity.runtime.id !== entity.id) problems.push("competition.runtime.id must equal the content id.");
      const stageIds = entity.runtime.stages.map((stage) => stage.id);
      const knownStages = new Set(stageIds);
      if (knownStages.size !== stageIds.length) problems.push("competition.runtime.stages contains duplicate ids.");
      for (const stage of entity.runtime.stages) {
        for (const prerequisiteId of stage.prerequisiteStageIds) {
          if (!knownStages.has(prerequisiteId)) {
            problems.push(`competition stage ${stage.id} references unknown prerequisite ${prerequisiteId}.`);
          }
          if (prerequisiteId === stage.id) problems.push(`competition stage ${stage.id} cannot require itself.`);
        }
        for (const requirementId of stage.requirementIds) {
          problems.push(
            ...capabilityProblems(
              rules,
              "competition-requirement",
              requirementId,
              `competition stage ${stage.id}.requirementIds`,
            ),
          );
        }
        for (const rewardId of stage.rewardIds) {
          problems.push(...(await requireLatestEntity(store, rewardId, "reward", `competition stage ${stage.id}.rewardIds`)));
        }
        problems.push(
          ...(await validateMediaAssets(
            store,
            stage.iconAssetId ? [stage.iconAssetId] : [],
            policy,
            `competition stage ${stage.id}.iconAssetId`,
          )),
        );
      }
      break;
    }

    case "help":
      for (const relatedId of entity.relatedContentIds) {
        problems.push(...(await requireLatestEntity(store, relatedId, undefined, "help.relatedContentIds", false)));
      }
      problems.push(...(await validateMediaAssets(store, entity.imageAssetIds, policy, "help.imageAssetIds")));
      break;

    case "media-asset":
      if (!entity.uri.trim()) problems.push("media-asset.uri is required.");
      if (policy.requireConfirmedAssetRights && entity.rightsStatus === "unknown") {
        problems.push("media-asset.rightsStatus cannot be unknown under the active publication policy.");
      }
      break;

    case "content-pack":
      problems.push(...(await validateContentPack(entity, store)));
      break;

    case "ruleset":
      problems.push(...(await validateRuleset(entity, store)));
      break;

    case "asset-inventory-item":
      if (entity.qaVerified && !entity.contentRecordComplete) {
        problems.push("asset-inventory-item cannot be QA verified before its content record is complete.");
      }
      break;

    case "game-setting":
      if (!entity.key.trim()) problems.push("game-setting.key is required.");
      break;
  }

  if (problems.length) throw new ContentValidationError(problems);
}
