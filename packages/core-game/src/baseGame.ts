import type { TrainerCardDefinition, TrainerCardInstance } from "./cards.js";
import type { CompetitionTrackDefinition } from "./competition.js";
import type { DogDefinition } from "./dogs.js";
import type { BoardSpaceMechanicsDefinition } from "./spaces.js";
import type { TokenDefinition, TokenInstance } from "./tokens.js";

export const DIGITAL_RULES_VERSION = "k9-blitz-digital-1.0";
export const DIGITAL_CONTENT_VERSION = "launch-1.0";

/**
 * The available physical references establish the component families and visible
 * theme. Missing legacy behavior was explicitly authorized by the owner as
 * digital product design. Keep that provenance distinct from source transcription.
 */
export const DIGITAL_RULES_PROVENANCE = {
  kind: "owner-authorized-digital-adaptation",
  sourceBasis:
    "K9 Blitz board photograph, project descriptions, visible components, dog names and named Barkley Ville locations",
  note:
    "Behavior absent from available legacy physical materials is intentional product design for the digital edition, not source-verbatim reconstruction.",
} as const;

/** Dog choice is identity/presentation only under Digital Rules v1. */
export const DIGITAL_BASE_DOGS: readonly DogDefinition[] = [
  { id: "max", name: "Max", breed: "Beagle", attributes: {}, skills: [], specialAbilityIds: [] },
  { id: "luna", name: "Luna", breed: "Corgi", attributes: {}, skills: [], specialAbilityIds: [] },
  { id: "rookie", name: "Rookie", breed: "Training Dog", attributes: {}, skills: [], specialAbilityIds: [] },
  { id: "ace", name: "Ace", breed: "Competition Dog", attributes: {}, skills: [], specialAbilityIds: [] },
];

/** Authored order is significant: the launch rules cycle through this list. */
export const DIGITAL_BASE_TRAINER_CARDS: readonly TrainerCardDefinition[] = [
  {
    id: "good-behavior",
    deckId: "trainer",
    title: "Good Behavior!",
    text: "Your dog nailed the exercise. Collect 2 Paw Tokens.",
    effects: [{ effectId: "GAIN_PAW_TOKENS", parameters: { amount: 2 } }],
  },
  {
    id: "quick-study",
    deckId: "trainer",
    title: "Quick Study",
    text: "Advance 1 Competition step.",
    effects: [{ effectId: "ADVANCE_COMPETITION", parameters: { amount: 1 } }],
  },
  {
    id: "zoomies",
    deckId: "trainer",
    title: "Zoomies!",
    text: "Move ahead 2 spaces. Do not resolve the destination space.",
    effects: [{ effectId: "MOVE", parameters: { amount: 2, resolveDestination: false } }],
  },
  {
    id: "water-break",
    deckId: "trainer",
    title: "Water Break",
    text: "Take a breather. No movement change.",
    effects: [{ effectId: "NO_EFFECT" }],
  },
  {
    id: "treat-pouch",
    deckId: "trainer",
    title: "Treat Pouch",
    text: "Collect 1 Paw Token.",
    effects: [{ effectId: "GAIN_PAW_TOKENS", parameters: { amount: 1 } }],
  },
  {
    id: "practice-pays",
    deckId: "trainer",
    title: "Practice Pays",
    text: "Advance 2 Competition steps.",
    effects: [{ effectId: "ADVANCE_COMPETITION", parameters: { amount: 2 } }],
  },
  {
    id: "distracted",
    deckId: "trainer",
    title: "Squirrel!",
    text: "Move back 1 space. Do not resolve the destination space.",
    effects: [{ effectId: "MOVE", parameters: { amount: -1, resolveDestination: false } }],
  },
  {
    id: "second-chance",
    deckId: "trainer",
    title: "Second Chance",
    text: "Take another turn after this one.",
    effects: [{ effectId: "GRANT_EXTRA_TURN" }],
  },
  {
    id: "park-pals",
    deckId: "trainer",
    title: "Park Pals",
    text: "Collect 1 Paw Token and advance 1 Competition step.",
    effects: [
      { effectId: "GAIN_PAW_TOKENS", parameters: { amount: 1 } },
      { effectId: "ADVANCE_COMPETITION", parameters: { amount: 1 } },
    ],
  },
  {
    id: "groomed",
    deckId: "trainer",
    title: "Freshly Groomed",
    text: "Looking sharp! Collect 2 Paw Tokens.",
    effects: [{ effectId: "GAIN_PAW_TOKENS", parameters: { amount: 2 } }],
  },
  {
    id: "training-bonus",
    deckId: "trainer",
    title: "Trainer's Bonus",
    text: "Move ahead 1 space and collect 1 Paw Token. Do not resolve the destination space.",
    effects: [
      { effectId: "MOVE", parameters: { amount: 1, resolveDestination: false } },
      { effectId: "GAIN_PAW_TOKENS", parameters: { amount: 1 } },
    ],
  },
  {
    id: "calm-focus",
    deckId: "trainer",
    title: "Calm & Focused",
    text: "Advance 1 Competition step.",
    effects: [{ effectId: "ADVANCE_COMPETITION", parameters: { amount: 1 } }],
  },
];

export const DIGITAL_BASE_TRAINER_CARD_INSTANCES: readonly TrainerCardInstance[] =
  DIGITAL_BASE_TRAINER_CARDS.map((card) => ({
    instanceId: `trainer-${card.id}`,
    definitionId: card.id,
  }));

export const DIGITAL_BASE_TOKENS: readonly TokenDefinition[] = [
  { id: "paw", label: "Paw Token", tags: ["reward", "spend-resource"] },
];

/**
 * The digital component inventory carries 24 token instances for bag/piece
 * presentation and deterministic token-system testing. Digital Rules v1 tracks
 * awarded tokens as counts, so supply exhaustion is not a gameplay constraint.
 */
export const DIGITAL_BASE_TOKEN_INSTANCES: readonly TokenInstance[] = Array.from(
  { length: 24 },
  (_, index) => ({ instanceId: `paw-${index + 1}`, definitionId: "paw" }),
);

const competitionLabels = [
  "Paw Basics",
  "Treat Manners",
  "Care Routine",
  "Dog Skills",
  "Agility",
  "Play & Recall",
  "Show Ring",
  "Champion",
] as const;
const competitionIcons = [
  "paw",
  "bone",
  "bowl",
  "dog",
  "agility",
  "frisbee",
  "show-dog",
  "trophy",
] as const;

export const DIGITAL_BASE_COMPETITION_TRACK: CompetitionTrackDefinition = {
  id: "k9-competition-track",
  stages: competitionLabels.map((label, index) => ({
    id: `competition-${index + 1}`,
    label,
    iconAssetId: `competition-${competitionIcons[index]}`,
    prerequisiteStageIds: index === 0 ? [] : [`competition-${index}`],
    requirementIds: [],
    rewardIds: index === 7 ? ["achievement:k9-competition-complete"] : [],
  })),
};

function landingAction(
  spaceIndex: number,
  id: string,
  label: string,
  resolverId: string,
  parameters?: Readonly<Record<string, unknown>>,
): BoardSpaceMechanicsDefinition {
  return {
    spaceId: `space-${spaceIndex}`,
    actions: [
      {
        id,
        label,
        trigger: "land",
        resolverId,
        ...(parameters === undefined ? {} : { parameters }),
      },
    ],
  };
}

export const DIGITAL_BASE_SPECIAL_SPACES: readonly BoardSpaceMechanicsDefinition[] = [
  landingAction(2, "academy", "K9 Academy", "ADVANCE_COMPETITION", { amount: 1 }),
  landingAction(4, "obedience-4", "Obedience Class", "GAIN_PAW_TOKENS", { amount: 1 }),
  landingAction(9, "trainer-9", "Trainer Card", "DRAW_TRAINER_CARD"),
  landingAction(14, "daycare", "Doggy Daycare", "GAIN_PAW_TOKENS", { amount: 1 }),
  landingAction(15, "agility", "Agility Run", "ADVANCE_COMPETITION", { amount: 1 }),
  landingAction(19, "vet-19", "Vet Check", "SPEND_PAW_TOKENS", { amount: 1, minimum: 0 }),
  landingAction(20, "obedience-20", "Obedience Class", "GAIN_PAW_TOKENS", { amount: 1 }),
  landingAction(22, "trainer-22", "Trainer Card", "DRAW_TRAINER_CARD"),
  landingAction(28, "park", "Pawsitive Park", "GAIN_PAW_TOKENS", { amount: 1 }),
  landingAction(32, "trainer-32", "Trainer Card", "DRAW_TRAINER_CARD"),
  landingAction(36, "treat-36", "Treat Stop", "GAIN_PAW_TOKENS", { amount: 2 }),
  landingAction(42, "trainer-42", "Trainer Card", "DRAW_TRAINER_CARD"),
  landingAction(48, "challenge", "Training Challenge", "ADVANCE_COMPETITION", { amount: 1 }),
  landingAction(52, "treat-52", "Treat Stop", "GAIN_PAW_TOKENS", { amount: 2 }),
  landingAction(56, "competition-zone", "Competition Zone", "ADVANCE_COMPETITION", { amount: 1 }),
  landingAction(58, "vet-58", "Vet Check", "SPEND_PAW_TOKENS", { amount: 1, minimum: 0 }),
  landingAction(62, "trainer-62", "Trainer Card", "DRAW_TRAINER_CARD"),
  landingAction(65, "treat-65", "Treat Stop", "GAIN_PAW_TOKENS", { amount: 2 }),
  landingAction(67, "trick", "Trick Learned", "ADVANCE_COMPETITION", { amount: 1 }),
  landingAction(71, "finish", "Finish", "FINISH_GAME"),
];

const specialSpaceMap = new Map(
  DIGITAL_BASE_SPECIAL_SPACES.map((definition) => [definition.spaceId, definition]),
);

/** Complete 72-space mechanics overlay used by the launch board route. */
export const DIGITAL_BASE_BOARD_SPACES: readonly BoardSpaceMechanicsDefinition[] = Array.from(
  { length: 72 },
  (_, index) => {
    const special = specialSpaceMap.get(`space-${index}`);
    if (special !== undefined) return special;
    if (index % 5 === 0) {
      return landingAction(index, `paw-bonus-${index}`, "Paw Bonus", "GAIN_PAW_TOKENS", {
        amount: 1,
      });
    }
    return { spaceId: `space-${index}`, actions: [] };
  },
);

export const DIGITAL_BASE_RULES = {
  players: { minimum: 2, maximum: 4, turnOrder: "setup-order" },
  movement: {
    dice: "2d6",
    use: "sum",
    minimum: 2,
    maximum: 12,
    doubles: "no-extra-effect",
    overshoot: "clamp-to-finish",
  },
  trainerCards: {
    count: 12,
    resolution: "immediate",
    destinationSpaceAfterCardMovement: "do-not-resolve",
    launchOrdering: "cyclic-versioned",
    hiddenInformation: false,
  },
  tokens: {
    resource: "paw",
    cannotBeNegative: true,
    victoryRequired: false,
    finiteSupplyConstrainsAwards: false,
  },
  competition: { stages: 8, maximumProgress: 8, victoryRequired: false },
  victory: { condition: "first-player-to-reach-finish", exactRollRequired: false },
} as const;
