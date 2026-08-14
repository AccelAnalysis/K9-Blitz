import {
  DIGITAL_BASE_BOARD_SPACES,
  DIGITAL_BASE_COMPETITION_TRACK,
  DIGITAL_BASE_DOGS,
  DIGITAL_BASE_RULES,
  DIGITAL_BASE_TOKENS,
  DIGITAL_BASE_TRAINER_CARDS,
  DIGITAL_CONTENT_VERSION,
  DIGITAL_RULES_VERSION,
} from "../../core-game/src/baseGame.ts";
import type {
  AssetInventoryItem,
  BoardSpaceContentDefinition,
  CatalogEntity,
  ChallengeContentDefinition,
  CompetitionContentDefinition,
  ContentMetadata,
  ContentPackDefinition,
  ContentType,
  DogContentDefinition,
  GameSettingDefinition,
  HelpContentDefinition,
  MediaAssetDefinition,
  PenaltyContentDefinition,
  RewardContentDefinition,
  RulesetDefinition,
  TokenContentDefinition,
  TrainerCardContentDefinition,
  TrainerDeckContentDefinition,
} from "./types.js";
import type { BoardSpaceRegistry, RuleCapabilityRegistry } from "./ports.js";

export const BASE_GAME_RULES_VERSION = DIGITAL_RULES_VERSION;
export const BASE_GAME_CONTENT_VERSION = DIGITAL_CONTENT_VERSION;
export const BASE_GAME_AUTHORIZED_AT = "2026-08-13T22:32:00-04:00";
export const BASE_GAME_AUTHORIZATION_BASIS = "owner-authorized-digital-adaptation";

const AUTHOR = "owner-authorized-digital-rules";
const TAGS = ["base-game", "digital-rules-v1", "owner-authorized"] as const;

function metadata<T extends ContentType>(id: string, contentType: T, title: string): ContentMetadata & { contentType: T } {
  return {
    id,
    contentType,
    slug: id.replaceAll(":", "-"),
    title,
    status: "published",
    verificationStatus: "qa-verified",
    revision: 1,
    tags: TAGS,
    createdAt: BASE_GAME_AUTHORIZED_AT,
    updatedAt: BASE_GAME_AUTHORIZED_AT,
    createdBy: AUTHOR,
    updatedBy: AUTHOR,
  };
}

export const BASE_GAME_DOG_CONTENT: readonly DogContentDefinition[] = DIGITAL_BASE_DOGS.map((dog) => ({
  ...metadata(dog.id, "dog", dog.name),
  runtime: dog,
  description: `${dog.name} is a selectable launch dog profile. Dog selection is presentation/identity only in Digital Rules v1.0.`,
}));

export const BASE_GAME_TRAINER_DECK: TrainerDeckContentDefinition = {
  ...metadata("trainer", "trainer-deck", "Barkley Ville Trainer Cards"),
  deckId: "trainer",
  description: "Twelve-card cyclic launch deck for K9 Blitz Digital Rules v1.0.",
};

export const BASE_GAME_TRAINER_CARD_CONTENT: readonly TrainerCardContentDefinition[] =
  DIGITAL_BASE_TRAINER_CARDS.map((card) => ({
    ...metadata(card.id, "trainer-card", card.title),
    runtime: card,
    rulesText: card.text,
  }));

export const BASE_GAME_TOKEN_CONTENT: readonly TokenContentDefinition[] = DIGITAL_BASE_TOKENS.map((token) => ({
  ...metadata(token.id, "token", token.label),
  runtime: token,
  rulesText: "Paw Tokens are earned from spaces/cards; Vet Check spends one when available; inventory cannot become negative.",
}));

export const BASE_GAME_BOARD_CONTENT: readonly BoardSpaceContentDefinition[] =
  DIGITAL_BASE_BOARD_SPACES.map((space) => ({
    ...metadata(space.spaceId, "board-space-content", space.actions[0]?.label ?? `Barkley Ville ${space.spaceId}`),
    runtime: space,
  }));

const ICON_LABELS: Readonly<Record<string, string>> = {
  "competition-paw": "Paw Basics",
  "competition-bone": "Treat Manners",
  "competition-bowl": "Care Routine",
  "competition-dog": "Dog Skills",
  "competition-agility": "Agility",
  "competition-frisbee": "Play & Recall",
  "competition-show-dog": "Show Ring",
  "competition-trophy": "Champion",
};

function iconDataUri(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#f7f3ea"/><text x="48" y="48" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="10" fill="#252932">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const BASE_GAME_COMPETITION_MEDIA: readonly MediaAssetDefinition[] =
  DIGITAL_BASE_COMPETITION_TRACK.stages.flatMap((stage) => stage.iconAssetId ? [{
    ...metadata(stage.iconAssetId, "media-asset", `${stage.label} icon`),
    assetType: "icon" as const,
    uri: iconDataUri(ICON_LABELS[stage.iconAssetId] ?? stage.label),
    mimeType: "image/svg+xml",
    altText: `${stage.label} competition icon`,
    sourceProvenance: "Owner-authorized Digital Rules v1 semantic icon placeholder.",
    rightsStatus: "confirmed" as const,
  }] : []);

export const BASE_GAME_COMPETITION: CompetitionContentDefinition = {
  ...metadata(DIGITAL_BASE_COMPETITION_TRACK.id, "competition", "K9 Competition Track"),
  runtime: DIGITAL_BASE_COMPETITION_TRACK,
  description: "Eight sequential progress stages; completion is an achievement but is not required for victory in Digital Rules v1.0.",
};

export const BASE_GAME_CHALLENGES: readonly ChallengeContentDefinition[] = [
  { ...metadata("challenge-obedience", "challenge", "Obedience Focus"), description: "Obedience training reward flow.", resolverId: "GAIN_PAW_TOKENS", parameters: { amount: 1 } },
  { ...metadata("challenge-agility", "challenge", "Agility Run"), description: "Agility training progress flow.", resolverId: "ADVANCE_COMPETITION", parameters: { amount: 1 } },
  { ...metadata("challenge-training", "challenge", "Training Challenge"), description: "General training progress flow.", resolverId: "ADVANCE_COMPETITION", parameters: { amount: 1 } },
  { ...metadata("challenge-vet", "challenge", "Vet Check"), description: "Routine wellness resource check.", resolverId: "SPEND_PAW_TOKENS", parameters: { amount: 1, minimum: 0 } },
];

export const BASE_GAME_REWARDS: readonly RewardContentDefinition[] = [
  { ...metadata("reward-paw-token", "reward", "Paw Token Reward"), description: "Award Paw Tokens.", resolverId: "GAIN_PAW_TOKENS", parameters: { amount: 1 } },
  { ...metadata("reward-competition-step", "reward", "Competition Progress"), description: "Advance Competition progress.", resolverId: "ADVANCE_COMPETITION", parameters: { amount: 1 } },
  { ...metadata("reward-extra-turn", "reward", "Extra Turn"), description: "Grant one extra turn.", resolverId: "GRANT_EXTRA_TURN" },
  { ...metadata("achievement:k9-competition-complete", "reward", "K9 Competition Complete"), description: "Record completion of the eight-stage Competition Track.", resolverId: "COMPETITION_COMPLETE" },
];

export const BASE_GAME_PENALTIES: readonly PenaltyContentDefinition[] = [
  { ...metadata("penalty-vet-token", "penalty", "Vet Check Cost"), description: "Spend one Paw Token if available.", resolverId: "SPEND_PAW_TOKENS", parameters: { amount: 1, minimum: 0 } },
  { ...metadata("penalty-move-back", "penalty", "Move Back"), description: "Move backward without resolving the destination.", resolverId: "MOVE", parameters: { amount: -1, resolveDestination: false } },
];

const HELP = {
  objective: "Be the first trainer to guide a dog from Start through Barkley Ville to Finish.",
  turn: "Roll two six-sided dice, move by the sum, clamp at Finish, resolve the landing space once, then pass play unless an extra turn was granted.",
  cards: "Trainer Cards resolve immediately in their versioned cyclic order. Movement caused by a card does not resolve the destination space.",
  tokens: "Paw Tokens are a reward/spend resource and cannot become negative.",
  competition: "The K9 Competition Track has eight sequential stages and is not required to win Digital Rules v1.0.",
  victory: "The first player to reach Finish wins; an exact roll is not required.",
} as const;

export const BASE_GAME_HELP_CONTENT: readonly HelpContentDefinition[] = Object.entries(HELP).map(([key, text]) => ({
  ...metadata(`help-${key}`, "help", key[0]!.toUpperCase() + key.slice(1)),
  category: key === "tokens" ? "token" : key === "competition" ? "competition" : key === "cards" ? "card" : "rule",
  shortText: text,
  fullText: text,
  imageAssetIds: [],
  relatedContentIds: [],
}));

export const BASE_GAME_SETTINGS: readonly GameSettingDefinition[] = Object.entries(DIGITAL_BASE_RULES).map(([key, value]) => ({
  ...metadata(`setting-${key}`, "game-setting", key),
  key,
  scope: "ruleset",
  value,
  description: `Authoritative Digital Rules v1.0 setting group: ${key}.`,
}));

const INVENTORY: readonly (readonly [string, AssetInventoryItem["componentCategory"], string, boolean])[] = [
  ["inventory-board", "board", "Board and route", false],
  ["inventory-rulebook", "rulebook", "Digital Rules v1.0", true],
  ["inventory-trainer-cards", "trainer-card", "Trainer Card set", true],
  ["inventory-dog-cards", "dog-card", "Dog profiles", true],
  ["inventory-token", "token", "Paw Token", true],
  ["inventory-pawns", "pawn", "Launch pawns", true],
  ["inventory-dice", "dice", "Two six-sided dice", true],
  ["inventory-help", "player-aid", "Rules and help", true],
  ["inventory-competition", "competition-track", "K9 Competition Track", true],
  ["inventory-logo", "packaging-logo", "K9 Blitz identity", true],
];

export const BASE_GAME_ASSET_INVENTORY: readonly AssetInventoryItem[] = INVENTORY.map(([id, componentCategory, title, artComplete]) => ({
  ...metadata(id, "asset-inventory-item", title),
  componentCategory,
  physicalReferenceStatus: "reference-only",
  frontImageStatus: "not-applicable",
  backImageStatus: "not-applicable",
  rulesCaptured: true,
  digitalArtworkComplete: artComplete,
  contentRecordComplete: true,
  qaVerified: true,
  rightsStatus: "confirmed",
  notes: "Inventory status for the owner-authorized digital edition; physical-source fidelity is tracked separately from digital product authority.",
}));

const COMPONENTS: readonly CatalogEntity[] = [
  ...BASE_GAME_DOG_CONTENT,
  BASE_GAME_TRAINER_DECK,
  ...BASE_GAME_TRAINER_CARD_CONTENT,
  ...BASE_GAME_TOKEN_CONTENT,
  ...BASE_GAME_BOARD_CONTENT,
  ...BASE_GAME_CHALLENGES,
  ...BASE_GAME_REWARDS,
  ...BASE_GAME_PENALTIES,
  BASE_GAME_COMPETITION,
  ...BASE_GAME_COMPETITION_MEDIA,
  ...BASE_GAME_HELP_CONTENT,
  ...BASE_GAME_SETTINGS,
  ...BASE_GAME_ASSET_INVENTORY,
];

export const BASE_GAME_CONTENT_PACK: ContentPackDefinition = {
  ...metadata(`k9-blitz-base-${DIGITAL_CONTENT_VERSION}`, "content-pack", "K9 Blitz Base Game"),
  version: DIGITAL_CONTENT_VERSION,
  compatibleRulesetIds: [DIGITAL_RULES_VERSION],
  entities: COMPONENTS.map((entity) => ({ id: entity.id, revision: entity.revision })),
  publishedAt: BASE_GAME_AUTHORIZED_AT,
};

export const BASE_GAME_RULESET: RulesetDefinition = {
  ...metadata(DIGITAL_RULES_VERSION, "ruleset", "K9 Blitz Digital Rules v1.0"),
  version: DIGITAL_RULES_VERSION,
  contentPacks: [{ id: BASE_GAME_CONTENT_PACK.id, revision: BASE_GAME_CONTENT_PACK.revision }],
  effectiveAt: BASE_GAME_AUTHORIZED_AT,
};

export const BASE_GAME_CATALOG: readonly CatalogEntity[] = [...COMPONENTS, BASE_GAME_CONTENT_PACK, BASE_GAME_RULESET];

const TRAINER_EFFECTS = new Set(DIGITAL_BASE_TRAINER_CARDS.flatMap((card) => card.effects.map((effect) => effect.effectId)));
const BOARD_RESOLVERS = new Set(DIGITAL_BASE_BOARD_SPACES.flatMap((space) => space.actions.map((action) => action.resolverId)));
const CHALLENGE_RESOLVERS = new Set(BASE_GAME_CHALLENGES.map((challenge) => challenge.resolverId));
const REWARD_RESOLVERS = new Set(BASE_GAME_REWARDS.map((reward) => reward.resolverId));
const PENALTY_RESOLVERS = new Set(BASE_GAME_PENALTIES.map((penalty) => penalty.resolverId));

export const BASE_GAME_RULE_CAPABILITY_REGISTRY: RuleCapabilityRegistry = {
  hasCapability(kind, capabilityId) {
    switch (kind) {
      case "trainer-card-effect": return TRAINER_EFFECTS.has(capabilityId);
      case "board-space-resolver": return BOARD_RESOLVERS.has(capabilityId);
      case "challenge-resolver": return CHALLENGE_RESOLVERS.has(capabilityId);
      case "reward-resolver": return REWARD_RESOLVERS.has(capabilityId);
      case "penalty-resolver": return PENALTY_RESOLVERS.has(capabilityId);
      case "competition-requirement": return true;
      case "dog-special-ability": return false;
      default: return false;
    }
  },
};

const BOARD_IDS = new Set(DIGITAL_BASE_BOARD_SPACES.map((space) => space.spaceId));
export const BASE_GAME_BOARD_SPACE_REGISTRY: BoardSpaceRegistry = {
  hasBoardSpace: (boardSpaceId) => BOARD_IDS.has(boardSpaceId),
};
