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
} from "./types.ts";
import type { BoardSpaceRegistry, RuleCapabilityRegistry } from "./ports.ts";

export const BASE_GAME_RULES_VERSION = "k9-blitz-digital-1.0";
export const BASE_GAME_CONTENT_VERSION = "launch-1.0";
export const BASE_GAME_AUTHORIZED_AT = "2026-08-13T22:32:00-04:00";
export const BASE_GAME_AUTHORIZATION_BASIS = "owner-authorized-digital-rules";

const PAWNS = [
  { id: "red", label: "Red", color: "#d83a35" },
  { id: "blue", label: "Blue", color: "#1688c9" },
  { id: "green", label: "Green", color: "#24a257" },
  { id: "yellow", label: "Yellow", color: "#f5c938" },
] as const;

const DOGS = [
  { id: "max", name: "Max", breed: "Beagle", icon: "🐶", note: "K9 Blitz dog profile" },
  { id: "luna", name: "Luna", breed: "Corgi", icon: "🐕", note: "K9 Blitz dog profile" },
  { id: "rookie", name: "Rookie", breed: "Training Dog", icon: "🦮", note: "K9 Blitz Digital Rules v1 profile" },
  { id: "ace", name: "Ace", breed: "Competition Dog", icon: "🐕‍🦺", note: "K9 Blitz Digital Rules v1 profile" },
] as const;

const POINTS = [
  [9, 88], [18, 89], [23, 89], [28, 90], [33, 88], [37, 83], [40, 78],
  [35, 71], [31, 69], [27, 69], [23, 70], [19, 71], [14, 70], [9, 67],
  [8, 62], [11, 57], [15, 55], [19, 55], [23, 56], [27, 55], [31, 52],
  [32, 47], [27, 44], [23, 44], [19, 44], [14, 43], [10, 40], [8, 34],
  [8, 28], [10, 22], [13, 18], [17, 17], [21, 17], [25, 17], [30, 19],
  [34, 23], [38, 28], [42, 31], [46, 33], [50, 34], [55, 34], [60, 33],
  [64, 29], [68, 24], [72, 19], [77, 16], [82, 17], [87, 20], [91, 25],
  [94, 31], [94, 37], [91, 43], [86, 41], [82, 41], [77, 41], [72, 44],
  [70, 50], [73, 50], [77, 50], [82, 51], [86, 51], [90, 52], [92, 56],
  [92, 61], [90, 65], [87, 66], [84, 67], [83, 72], [84, 77], [86, 81],
  [89, 84], [91, 86],
] as const;

const SPECIAL: Readonly<Record<number, { readonly type: string; readonly title: string; readonly text: string }>> = {
  0: { type: "normal", title: "Start", text: "Every trainer begins here." },
  2: { type: "training", title: "K9 Academy", text: "Training day! Advance one Competition step." },
  4: { type: "training", title: "Obedience Class", text: "Great focus! Earn one Paw Token." },
  9: { type: "trainer", title: "Trainer Card", text: "Draw a Trainer Card." },
  14: { type: "daycare", title: "Doggy Daycare", text: "A playful break. Earn one Paw Token." },
  15: { type: "agility", title: "Agility Run", text: "Complete the course and advance one Competition step." },
  19: { type: "vet", title: "Vet Check", text: "Routine checkup. Spend one Paw Token if you have one." },
  20: { type: "training", title: "Obedience Class", text: "Good manners! Earn one Paw Token." },
  22: { type: "trainer", title: "Trainer Card", text: "Draw a Trainer Card." },
  28: { type: "token", title: "Pawsitive Park", text: "Playtime reward: collect one Paw Token." },
  32: { type: "trainer", title: "Trainer Card", text: "Draw a Trainer Card." },
  36: { type: "token", title: "Treat Stop", text: "Good dog! Collect two Paw Tokens." },
  42: { type: "trainer", title: "Trainer Card", text: "Draw a Trainer Card." },
  48: { type: "training", title: "Training Challenge", text: "Advance one Competition step." },
  52: { type: "token", title: "Treat Stop", text: "Collect two Paw Tokens." },
  56: { type: "competition", title: "Competition Zone", text: "Show what you learned: advance one Competition step." },
  58: { type: "vet", title: "Vet Check", text: "Spend one Paw Token if you have one." },
  62: { type: "trainer", title: "Trainer Card", text: "Draw a Trainer Card." },
  65: { type: "token", title: "Treat Stop", text: "Collect two Paw Tokens." },
  67: { type: "training", title: "Trick Learned", text: "Advance one Competition step." },
  71: { type: "finish", title: "Finish", text: "You made it to the Barkley Ville winner's podium!" },
};

const BOARD_SPACES = POINTS.map(([x, y], index) => ({
  id: `space-${index}`,
  index,
  x,
  y,
  ...(SPECIAL[index] ?? {
    type: index % 5 === 0 ? "token" : "normal",
    title: index % 5 === 0 ? "Paw Bonus" : "Barkley Ville",
    text: index % 5 === 0 ? "Collect one Paw Token." : "Keep training and have fun!",
  }),
}));

const TRAINER_CARDS = [
  { id: "good-behavior", title: "Good Behavior!", text: "Your dog nailed the exercise. Collect 2 Paw Tokens.", effect: { type: "tokens", amount: 2 }, icon: "⭐" },
  { id: "quick-study", title: "Quick Study", text: "Advance 1 Competition step.", effect: { type: "competition", amount: 1 }, icon: "🎓" },
  { id: "zoomies", title: "Zoomies!", text: "Move ahead 2 spaces. Do not resolve the destination space.", effect: { type: "move", amount: 2 }, icon: "💨" },
  { id: "water-break", title: "Water Break", text: "Take a breather. No movement change.", effect: { type: "none" }, icon: "💧" },
  { id: "treat-pouch", title: "Treat Pouch", text: "Collect 1 Paw Token.", effect: { type: "tokens", amount: 1 }, icon: "🦴" },
  { id: "practice-pays", title: "Practice Pays", text: "Advance 2 Competition steps.", effect: { type: "competition", amount: 2 }, icon: "🏅" },
  { id: "distracted", title: "Squirrel!", text: "Move back 1 space. Do not resolve the destination space.", effect: { type: "move", amount: -1 }, icon: "🐿️" },
  { id: "second-chance", title: "Second Chance", text: "Take another turn after this one.", effect: { type: "extraTurn" }, icon: "🎲" },
  { id: "park-pals", title: "Park Pals", text: "Collect 1 Paw Token and advance 1 Competition step.", effect: { type: "combo", tokens: 1, competition: 1 }, icon: "🐾" },
  { id: "groomed", title: "Freshly Groomed", text: "Looking sharp! Collect 2 Paw Tokens.", effect: { type: "tokens", amount: 2 }, icon: "✨" },
  { id: "training-bonus", title: "Trainer's Bonus", text: "Move ahead 1 space and collect 1 Paw Token. Do not resolve the destination space.", effect: { type: "comboMove", move: 1, tokens: 1 }, icon: "📣" },
  { id: "calm-focus", title: "Calm & Focused", text: "Advance 1 Competition step.", effect: { type: "competition", amount: 1 }, icon: "🧠" },
] as const;

const COMPETITION_ICONS = ["🐾", "🦴", "🥣", "🐶", "🛝", "🥏", "🐕", "🏆"] as const;

const HELP = {
  objective: "Be the first trainer to guide your dog from Start through Barkley Ville to the Finish podium.",
  turn: "Roll two six-sided dice, move forward by the total, stop at Finish if you would overshoot, then resolve the landing space once.",
  trainerCards: "Trainer Cards resolve immediately. Card movement never triggers the destination space in Digital Rules v1.0.",
  tokens: "Paw Tokens are earned from spaces and cards. Vet Check spends one token when available; token inventory never becomes negative.",
  competition: "The K9 Competition Track has eight steps. Completion is an achievement recorded in results but is not required to win v1.0.",
  victory: "The first trainer to reach Finish wins immediately.",
} as const;

const DIGITAL_RULES = {
  id: BASE_GAME_RULES_VERSION,
  name: "K9 Blitz Digital Rules",
  displayVersion: "1.0",
  players: { min: 2, max: 4 },
  turnOrder: "setup-order",
  diceCount: 2,
  movement: "sum-forward-clamp-at-finish",
  resolveLandingOnce: true,
  trainerCardMovementTriggersLanding: false,
  competitionMaximum: 8,
  victory: "first-to-finish",
  hiddenInformation: false,
} as const;

export const BASE_GAME_WEB_CATALOG = {
  schemaVersion: 1,
  rulesVersion: BASE_GAME_RULES_VERSION,
  contentVersion: BASE_GAME_CONTENT_VERSION,
  editionName: "K9 Blitz Digital Rules v1.0",
  authorizationBasis: BASE_GAME_AUTHORIZATION_BASIS,
  authorizedAt: BASE_GAME_AUTHORIZED_AT,
  digitalRules: DIGITAL_RULES,
  pawns: PAWNS,
  dogs: DOGS,
  boardSpaces: BOARD_SPACES,
  trainerCards: TRAINER_CARDS,
  competitionIcons: COMPETITION_ICONS,
  help: HELP,
};

const AUTHOR = "owner-authorized-digital-rules";
const TAGS = ["base-game", "digital-edition-1", "owner-authorized"] as const;

function metadata<T extends ContentType>(id: string, contentType: T, title: string): ContentMetadata & { contentType: T } {
  return {
    id,
    contentType,
    slug: id,
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

export const BASE_GAME_DOG_CONTENT: readonly DogContentDefinition[] = DOGS.map((dog) => ({
  ...metadata(dog.id, "dog", dog.name),
  description: dog.note,
  runtime: {
    id: dog.id,
    name: dog.name,
    breed: dog.breed,
    attributes: { edition: "Digital Edition 1.0" },
    skills: [],
    specialAbilityIds: [],
  },
}));

export const BASE_GAME_TRAINER_DECK: TrainerDeckContentDefinition = {
  ...metadata("trainer-deck-base", "trainer-deck", "Barkley Ville Trainer Cards"),
  deckId: "trainer-deck-base",
  description: "Twelve-card owner-authorized Trainer deck for K9 Blitz Digital Rules v1.0.",
};

type WebEffect = (typeof TRAINER_CARDS)[number]["effect"];
function coreEffect(effect: WebEffect): TrainerCardContentDefinition["runtime"]["effects"][number] {
  switch (effect.type) {
    case "tokens": return { effectId: "award-paw-tokens", parameters: { amount: effect.amount } };
    case "competition": return { effectId: "advance-competition", parameters: { amount: effect.amount } };
    case "move": return { effectId: "move-spaces", parameters: { amount: effect.amount } };
    case "extraTurn": return { effectId: "extra-turn" };
    case "combo": return { effectId: "award-and-advance", parameters: { tokens: effect.tokens, competition: effect.competition } };
    case "comboMove": return { effectId: "move-and-award", parameters: { move: effect.move, tokens: effect.tokens } };
    case "none": return { effectId: "no-op" };
  }
}

export const BASE_GAME_TRAINER_CARD_CONTENT: readonly TrainerCardContentDefinition[] = TRAINER_CARDS.map((card) => ({
  ...metadata(card.id, "trainer-card", card.title),
  rulesText: card.text,
  runtime: {
    id: card.id,
    deckId: BASE_GAME_TRAINER_DECK.id,
    title: card.title,
    text: card.text,
    effects: [coreEffect(card.effect)],
    tags: ["base-game"],
  },
}));

export const BASE_GAME_TOKEN: TokenContentDefinition = {
  ...metadata("paw-token", "token", "Paw Token"),
  rulesText: HELP.tokens,
  runtime: { id: "paw-token", label: "Paw Token", tags: ["currency", "training"] },
};

function spaceActions(space: (typeof BOARD_SPACES)[number]): BoardSpaceContentDefinition["runtime"]["actions"] {
  const baseId = `${space.id}-land`;
  switch (space.type) {
    case "trainer": return [{ id: baseId, label: "Draw Trainer Card", trigger: "land", resolverId: "draw-trainer-card" }];
    case "vet": return [{ id: baseId, label: "Vet Check", trigger: "land", resolverId: "spend-paw-token", parameters: { amount: 1 } }];
    case "daycare": return [{ id: baseId, label: "Doggy Daycare", trigger: "land", resolverId: "award-paw-tokens", parameters: { amount: 1 } }];
    case "token": return [{ id: baseId, label: space.title, trigger: "land", resolverId: "award-paw-tokens", parameters: { amount: space.title === "Treat Stop" ? 2 : 1 } }];
    case "training":
      return [{ id: baseId, label: space.title, trigger: "land", resolverId: space.title === "Obedience Class" ? "award-paw-tokens" : "advance-competition", parameters: { amount: 1 } }];
    case "agility":
    case "competition": return [{ id: baseId, label: space.title, trigger: "land", resolverId: "advance-competition", parameters: { amount: 1 } }];
    case "finish": return [{ id: baseId, label: "Finish Game", trigger: "land", resolverId: "declare-winner" }];
    default: return [];
  }
}

export const BASE_GAME_BOARD_CONTENT: readonly BoardSpaceContentDefinition[] = BOARD_SPACES.map((space) => ({
  ...metadata(space.id, "board-space-content", space.title),
  runtime: { spaceId: space.id, actions: spaceActions(space) },
}));

export const BASE_GAME_CHALLENGES: readonly ChallengeContentDefinition[] = [
  { ...metadata("challenge-obedience", "challenge", "Obedience Focus"), description: "Complete a focused obedience training exercise.", resolverId: "challenge-obedience" },
  { ...metadata("challenge-agility", "challenge", "Agility Sprint"), description: "Complete a short agility course.", resolverId: "challenge-agility" },
  { ...metadata("challenge-grooming", "challenge", "Grooming Ready"), description: "Prepare the dog for presentation and handling.", resolverId: "challenge-grooming" },
  { ...metadata("challenge-vet", "challenge", "Wellness Check"), description: "Complete a routine wellness checkpoint.", resolverId: "challenge-vet" },
];

export const BASE_GAME_REWARDS: readonly RewardContentDefinition[] = [
  { ...metadata("reward-paw-token", "reward", "Paw Token Reward"), description: "Award one Paw Token.", resolverId: "reward-paw-token", parameters: { amount: 1 } },
  { ...metadata("reward-two-paw-tokens", "reward", "Two Paw Token Reward"), description: "Award two Paw Tokens.", resolverId: "reward-paw-token", parameters: { amount: 2 } },
  { ...metadata("reward-competition-step", "reward", "Competition Progress"), description: "Advance one Competition step.", resolverId: "reward-competition-step", parameters: { amount: 1 } },
];

export const BASE_GAME_PENALTIES: readonly PenaltyContentDefinition[] = [
  { ...metadata("penalty-vet-token", "penalty", "Vet Check Cost"), description: "Spend one Paw Token if available.", resolverId: "penalty-spend-paw-token", parameters: { amount: 1 } },
  { ...metadata("penalty-move-back", "penalty", "Move Back"), description: "Move backward the configured number of spaces.", resolverId: "penalty-move-back", parameters: { amount: 1 } },
];

export const BASE_GAME_COMPETITION: CompetitionContentDefinition = {
  ...metadata("k9-competition-track", "competition", "K9 Competition Track"),
  description: HELP.competition,
  runtime: {
    id: "k9-competition-track",
    stages: COMPETITION_ICONS.map((icon, index) => ({
      id: `competition-step-${index + 1}`,
      label: index === COMPETITION_ICONS.length - 1 ? "Champion" : `Competition Step ${index + 1}`,
      prerequisiteStageIds: index === 0 ? [] : [`competition-step-${index}`],
      requirementIds: [],
      rewardIds: [],
    })),
  },
};

export const BASE_GAME_HELP_CONTENT: readonly HelpContentDefinition[] = Object.entries(HELP).map(([key, value]) => ({
  ...metadata(`help-${key}`, "help", key.replaceAll("-", " ").replace(/^./, (first) => first.toUpperCase())),
  category: key === "tokens" ? "token" : key === "competition" ? "competition" : "rule",
  shortText: value,
  fullText: value,
  imageAssetIds: [],
  relatedContentIds: [],
}));

export const BASE_GAME_SETTINGS: readonly GameSettingDefinition[] = Object.entries(DIGITAL_RULES).map(([key, value]) => ({
  ...metadata(`setting-${key}`, "game-setting", key),
  key,
  scope: "ruleset",
  value,
  description: `K9 Blitz Digital Rules v1.0 setting: ${key}.`,
}));

export const BASE_GAME_MEDIA: readonly MediaAssetDefinition[] = [
  { ...metadata("media-board", "media-asset", "Barkley Ville Board"), assetType: "board", uri: "./assets/board.svg", mimeType: "image/svg+xml", altText: "K9 Blitz Barkley Ville game board", sourceProvenance: "Owner-authorized K9 Blitz digital board asset.", rightsStatus: "confirmed" },
  { ...metadata("media-logo", "media-asset", "K9 Blitz Mark"), assetType: "logo", uri: "./assets/favicon.svg", mimeType: "image/svg+xml", altText: "K9 Blitz logo mark", sourceProvenance: "Owner-authorized K9 Blitz digital mark.", rightsStatus: "confirmed" },
];

const ASSET_INVENTORY_ROWS: readonly (readonly [string, AssetInventoryItem["componentCategory"], string])[] = [
  ["inventory-board", "board", "Board and track"],
  ["inventory-rulebook", "rulebook", "Digital Edition rules"],
  ["inventory-trainer-cards", "trainer-card", "Trainer Card set"],
  ["inventory-dog-cards", "dog-card", "Dog profiles"],
  ["inventory-token", "token", "Paw Token"],
  ["inventory-pawns", "pawn", "Player pawns"],
  ["inventory-dice", "dice", "Two six-sided dice"],
  ["inventory-help", "player-aid", "Rules and help"],
  ["inventory-competition", "competition-track", "K9 Competition Track"],
  ["inventory-logo", "packaging-logo", "K9 Blitz identity"],
];

export const BASE_GAME_ASSET_INVENTORY: readonly AssetInventoryItem[] = ASSET_INVENTORY_ROWS.map(([id, componentCategory, title]) => ({
  ...metadata(id, "asset-inventory-item", title),
  componentCategory,
  physicalReferenceStatus: "reference-only",
  frontImageStatus: "not-applicable",
  backImageStatus: "not-applicable",
  rulesCaptured: true,
  digitalArtworkComplete: true,
  contentRecordComplete: true,
  qaVerified: true,
  rightsStatus: "confirmed",
  notes: "Completed for the owner-authorized Digital Edition 1.0 baseline; not represented as a verbatim physical-rulebook transcription.",
}));

const BASE_COMPONENT_ENTITIES: readonly CatalogEntity[] = [
  ...BASE_GAME_DOG_CONTENT,
  BASE_GAME_TRAINER_DECK,
  ...BASE_GAME_TRAINER_CARD_CONTENT,
  BASE_GAME_TOKEN,
  ...BASE_GAME_BOARD_CONTENT,
  ...BASE_GAME_CHALLENGES,
  ...BASE_GAME_REWARDS,
  ...BASE_GAME_PENALTIES,
  BASE_GAME_COMPETITION,
  ...BASE_GAME_HELP_CONTENT,
  ...BASE_GAME_SETTINGS,
  ...BASE_GAME_MEDIA,
  ...BASE_GAME_ASSET_INVENTORY,
];

export const BASE_GAME_CONTENT_PACK: ContentPackDefinition = {
  ...metadata("base-game-pack", "content-pack", "K9 Blitz Base Game"),
  version: BASE_GAME_CONTENT_VERSION,
  compatibleRulesetIds: ["digital-edition-rules"],
  entities: BASE_COMPONENT_ENTITIES.map((entity) => ({ id: entity.id, revision: entity.revision })),
  publishedAt: BASE_GAME_AUTHORIZED_AT,
};

export const BASE_GAME_RULESET: RulesetDefinition = {
  ...metadata("digital-edition-rules", "ruleset", "K9 Blitz Digital Edition Rules"),
  version: BASE_GAME_RULES_VERSION,
  contentPacks: [{ id: BASE_GAME_CONTENT_PACK.id, revision: BASE_GAME_CONTENT_PACK.revision }],
  effectiveAt: BASE_GAME_AUTHORIZED_AT,
};

export const BASE_GAME_CATALOG: readonly CatalogEntity[] = [
  ...BASE_COMPONENT_ENTITIES,
  BASE_GAME_CONTENT_PACK,
  BASE_GAME_RULESET,
];

const CAPABILITIES = new Set([
  "trainer-card-effect:award-paw-tokens",
  "trainer-card-effect:advance-competition",
  "trainer-card-effect:move-spaces",
  "trainer-card-effect:extra-turn",
  "trainer-card-effect:award-and-advance",
  "trainer-card-effect:move-and-award",
  "trainer-card-effect:no-op",
  "board-space-resolver:draw-trainer-card",
  "board-space-resolver:spend-paw-token",
  "board-space-resolver:award-paw-tokens",
  "board-space-resolver:advance-competition",
  "board-space-resolver:declare-winner",
  "challenge-resolver:challenge-obedience",
  "challenge-resolver:challenge-agility",
  "challenge-resolver:challenge-grooming",
  "challenge-resolver:challenge-vet",
  "reward-resolver:reward-paw-token",
  "reward-resolver:reward-competition-step",
  "penalty-resolver:penalty-spend-paw-token",
  "penalty-resolver:penalty-move-back",
]);

export const BASE_GAME_RULE_CAPABILITY_REGISTRY: RuleCapabilityRegistry = {
  hasCapability: (kind, capabilityId) => CAPABILITIES.has(`${kind}:${capabilityId}`),
};

const BOARD_SPACE_IDS = new Set(BOARD_SPACES.map((space) => space.id));
export const BASE_GAME_BOARD_SPACE_REGISTRY: BoardSpaceRegistry = {
  hasBoardSpace: (boardSpaceId) => BOARD_SPACE_IDS.has(boardSpaceId),
};
