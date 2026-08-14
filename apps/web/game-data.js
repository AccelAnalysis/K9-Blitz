export const RULES_VERSION = "digital-demo-0.1";
export const CONTENT_VERSION = "launch-0.1";

export const PAWNS = [
  { id: "red", label: "Red", color: "#d83a35" },
  { id: "blue", label: "Blue", color: "#1688c9" },
  { id: "green", label: "Green", color: "#24a257" },
  { id: "yellow", label: "Yellow", color: "#f5c938" },
];

export const DOGS = [
  { id: "max", name: "Max", breed: "Beagle", icon: "🐶", note: "Visible physical-game profile" },
  { id: "luna", name: "Luna", breed: "Corgi", icon: "🐕", note: "Visible physical-game profile" },
  { id: "rookie", name: "Rookie", breed: "Training Dog", icon: "🦮", note: "Digital demo profile" },
  { id: "ace", name: "Ace", breed: "Competition Dog", icon: "🐕‍🦺", note: "Digital demo profile" },
];

// Normalized x/y coordinates over the perspective-corrected board artwork.
// This is a launch-ready scenic route through Barkley Ville. It is intentionally
// versioned as Digital Demo Rules until the authoritative physical rulebook and
// production board coordinate map are available.
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

export const BOARD_SPACES = POINTS.map(([x, y], index) => ({
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

export const TRAINER_CARDS = [
  { id: "good-behavior", title: "Good Behavior!", text: "Your dog nailed the exercise. Collect 2 Paw Tokens.", effect: { type: "tokens", amount: 2 }, icon: "⭐" },
  { id: "quick-study", title: "Quick Study", text: "Advance 1 Competition step.", effect: { type: "competition", amount: 1 }, icon: "🎓" },
  { id: "zoomies", title: "Zoomies!", text: "Move ahead 2 spaces.", effect: { type: "move", amount: 2 }, icon: "💨" },
  { id: "water-break", title: "Water Break", text: "Take a breather. No movement change.", effect: { type: "none" }, icon: "💧" },
  { id: "treat-pouch", title: "Treat Pouch", text: "Collect 1 Paw Token.", effect: { type: "tokens", amount: 1 }, icon: "🦴" },
  { id: "practice-pays", title: "Practice Pays", text: "Advance 2 Competition steps.", effect: { type: "competition", amount: 2 }, icon: "🏅" },
  { id: "distracted", title: "Squirrel!", text: "Move back 1 space.", effect: { type: "move", amount: -1 }, icon: "🐿️" },
  { id: "second-chance", title: "Second Chance", text: "Take another turn after this one.", effect: { type: "extraTurn" }, icon: "🎲" },
  { id: "park-pals", title: "Park Pals", text: "Collect 1 Paw Token and advance 1 Competition step.", effect: { type: "combo", tokens: 1, competition: 1 }, icon: "🐾" },
  { id: "groomed", title: "Freshly Groomed", text: "Looking sharp! Collect 2 Paw Tokens.", effect: { type: "tokens", amount: 2 }, icon: "✨" },
  { id: "training-bonus", title: "Trainer's Bonus", text: "Move ahead 1 space and collect 1 Paw Token.", effect: { type: "comboMove", move: 1, tokens: 1 }, icon: "📣" },
  { id: "calm-focus", title: "Calm & Focused", text: "Advance 1 Competition step.", effect: { type: "competition", amount: 1 }, icon: "🧠" },
];

export const COMPETITION_ICONS = ["🐾", "🦴", "🥣", "🐶", "🛝", "🥏", "🐕", "🏆"];
