export const CONTENT_OVERRIDE_KEY = "k9-blitz:content-admin:published:v1";
export const BASE_RULES_VERSION = "k9-blitz-digital-1.0";
export const BASE_CONTENT_VERSION = "launch-1.0";
export const OWNER_AUTHORIZED_AT = "2026-08-13T22:32:00-04:00";

const BASE_DIGITAL_RULES = {
  id: BASE_RULES_VERSION,
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
};

const BASE_PAWNS = [
  { id: "red", label: "Red", color: "#d83a35" },
  { id: "blue", label: "Blue", color: "#1688c9" },
  { id: "green", label: "Green", color: "#24a257" },
  { id: "yellow", label: "Yellow", color: "#f5c938" },
];

const BASE_DOGS = [
  { id: "max", name: "Max", breed: "Beagle", icon: "🐶", note: "K9 Blitz dog profile" },
  { id: "luna", name: "Luna", breed: "Corgi", icon: "🐕", note: "K9 Blitz dog profile" },
  { id: "rookie", name: "Rookie", breed: "Training Dog", icon: "🦮", note: "K9 Blitz Digital Rules v1 profile" },
  { id: "ace", name: "Ace", breed: "Competition Dog", icon: "🐕‍🦺", note: "K9 Blitz Digital Rules v1 profile" },
];

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
  [89, 84], [91, 86]
];

const SPECIAL = {
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

const BASE_BOARD_SPACES = POINTS.map(([x, y], index) => ({
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

const BASE_TRAINER_CARDS = [
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
];

const BASE_COMPETITION_ICONS = ["🐾", "🦴", "🥣", "🐶", "🛝", "🥏", "🐕", "🏆"];

const BASE_HELP = {
  objective: "Be the first trainer to guide your dog from Start through Barkley Ville to the Finish podium.",
  turn: "Roll two six-sided dice, move forward by the total, stop at Finish if you would overshoot, then resolve the landing space once.",
  trainerCards: "Trainer Cards resolve immediately. Card movement never triggers the destination space in Digital Rules v1.0.",
  tokens: "Paw Tokens are earned from spaces and cards. Vet Check spends one token when available; token inventory never becomes negative.",
  competition: "The K9 Competition Track has eight steps. Completion is an achievement recorded in results but is not required to win v1.0.",
  victory: "The first trainer to reach Finish wins immediately.",
};

export const BASE_CONTENT_CATALOG = {
  schemaVersion: 1,
  rulesVersion: BASE_RULES_VERSION,
  contentVersion: BASE_CONTENT_VERSION,
  editionName: "K9 Blitz Digital Rules v1.0",
  authorizationBasis: "owner-authorized-digital-rules",
  authorizedAt: OWNER_AUTHORIZED_AT,
  digitalRules: BASE_DIGITAL_RULES,
  pawns: BASE_PAWNS,
  dogs: BASE_DOGS,
  boardSpaces: BASE_BOARD_SPACES,
  trainerCards: BASE_TRAINER_CARDS,
  competitionIcons: BASE_COMPETITION_ICONS,
  help: BASE_HELP,
};

const ALLOWED_EFFECT_TYPES = new Set(["tokens", "competition", "move", "extraTurn", "combo", "comboMove", "none"]);
const ALLOWED_SPACE_TYPES = new Set(["normal", "token", "training", "trainer", "daycare", "agility", "vet", "competition", "finish"]);

function validInteger(value) {
  return Number.isInteger(value);
}

function validCardEffect(effect) {
  if (!effect || !ALLOWED_EFFECT_TYPES.has(effect.type)) return false;
  switch (effect.type) {
    case "tokens":
    case "competition":
    case "move":
      return validInteger(effect.amount);
    case "combo":
      return validInteger(effect.tokens) && validInteger(effect.competition);
    case "comboMove":
      return validInteger(effect.move) && validInteger(effect.tokens);
    case "extraTurn":
    case "none":
      return true;
    default:
      return false;
  }
}

function hasUniqueIds(items) {
  return Array.isArray(items) && new Set(items.map((item) => item?.id)).size === items.length && items.every((item) => typeof item?.id === "string" && item.id.length > 0);
}

export function validateContentCatalog(catalog) {
  const problems = [];
  if (!catalog || typeof catalog !== "object") return ["Catalog must be an object."];
  if (catalog.schemaVersion !== 1) problems.push("schemaVersion must equal 1.");
  if (typeof catalog.rulesVersion !== "string" || !catalog.rulesVersion) problems.push("rulesVersion is required.");
  if (typeof catalog.contentVersion !== "string" || !catalog.contentVersion) problems.push("contentVersion is required.");
  if (!catalog.digitalRules || catalog.digitalRules.id !== catalog.rulesVersion) problems.push("digitalRules.id must match rulesVersion.");
  if (catalog.digitalRules?.players?.min !== 2 || catalog.digitalRules?.players?.max !== 4) problems.push("Digital Rules v1 require the configured 2–4 player range.");
  if (
    catalog.digitalRules?.turnOrder !== "setup-order" ||
    catalog.digitalRules?.diceCount !== 2 ||
    catalog.digitalRules?.movement !== "sum-forward-clamp-at-finish" ||
    catalog.digitalRules?.resolveLandingOnce !== true ||
    catalog.digitalRules?.trainerCardMovementTriggersLanding !== false ||
    catalog.digitalRules?.competitionMaximum !== 8 ||
    catalog.digitalRules?.victory !== "first-to-finish" ||
    catalog.digitalRules?.hiddenInformation !== false
  ) problems.push("Digital Rules v1 core settings are invalid or require a new engine/rules version.");
  if (!hasUniqueIds(catalog.pawns) || catalog.pawns.length !== 4) problems.push("Exactly four uniquely identified pawn colors are required.");
  else if (catalog.pawns.some((pawn) => !pawn.label || typeof pawn.color !== "string")) problems.push("Every pawn requires a label and color.");
  if (!hasUniqueIds(catalog.dogs) || catalog.dogs.length < 4) problems.push("At least four uniquely identified dogs are required.");
  else if (catalog.dogs.some((dog) => !dog.name || !dog.breed || !dog.icon)) problems.push("Every dog requires a name, breed, and icon.");
  if (!hasUniqueIds(catalog.trainerCards) || catalog.trainerCards.length < 12) problems.push("At least twelve uniquely identified Trainer Cards are required.");
  if (!Array.isArray(catalog.boardSpaces) || catalog.boardSpaces.length !== 72) problems.push("Digital Rules v1 require exactly 72 spaces (0–71).");
  if (Array.isArray(catalog.boardSpaces)) {
    catalog.boardSpaces.forEach((space, index) => {
      if (space?.id !== `space-${index}` || space?.index !== index) problems.push(`Board space ${index} must use id space-${index} and matching index.`);
      if (!Number.isFinite(space?.x) || !Number.isFinite(space?.y)) problems.push(`Board space ${index} requires numeric x/y coordinates.`);
      if (!ALLOWED_SPACE_TYPES.has(space?.type) || !space?.title || !space?.text) problems.push(`Board space ${index} has an unsupported or incomplete content definition.`);
    });
  }
  if (!Array.isArray(catalog.competitionIcons) || catalog.competitionIcons.length !== 8 || catalog.competitionIcons.some((icon) => typeof icon !== "string" || !icon)) problems.push("Competition Track must contain eight labeled steps.");
  if (!catalog.help || typeof catalog.help !== "object" || Object.values(catalog.help).some((value) => typeof value !== "string" || !value)) problems.push("Rules & Help entries must be non-empty strings.");
  for (const card of catalog.trainerCards ?? []) {
    if (!card.title || !card.text || !validCardEffect(card.effect)) problems.push(`Trainer Card ${card.id ?? "unknown"} has an unsupported or incomplete effect.`);
  }
  return problems;
}

function readPublishedOverride() {
  try {
    if (typeof globalThis.localStorage === "undefined") return null;
    const raw = globalThis.localStorage.getItem(CONTENT_OVERRIDE_KEY);
    if (!raw) return null;
    const candidate = JSON.parse(raw);
    return validateContentCatalog(candidate).length === 0 ? candidate : null;
  } catch {
    return null;
  }
}

export const CONTENT_CATALOG = readPublishedOverride() ?? BASE_CONTENT_CATALOG;
export const RULES_VERSION = CONTENT_CATALOG.rulesVersion;
export const CONTENT_VERSION = CONTENT_CATALOG.contentVersion;
export const DIGITAL_RULES = Object.freeze(CONTENT_CATALOG.digitalRules);
export const PAWNS = CONTENT_CATALOG.pawns;
export const DOGS = CONTENT_CATALOG.dogs;
export const BOARD_SPACES = CONTENT_CATALOG.boardSpaces;
export const TRAINER_CARDS = CONTENT_CATALOG.trainerCards;
export const COMPETITION_ICONS = CONTENT_CATALOG.competitionIcons;
export const GAME_HELP = CONTENT_CATALOG.help;
