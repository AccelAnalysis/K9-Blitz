import {
  BOARD_SPACES,
  COMPETITION_ICONS,
  CONTENT_VERSION,
  DOGS,
  PAWNS,
  RULES_VERSION,
} from "./game-data.js";
import {
  LAST_SPACE,
  advancePosition,
  advanceTurn,
  appendHistory,
  applyCardEffect,
  applySpaceEffect,
  createGame,
  declareWinnerIfFinished,
  drawTrainerCard,
  replacePlayer,
  rollDice,
} from "./game-engine.js";

const STORAGE_KEY = "k9-blitz:launch-game:v1";
const SETTINGS_KEY = "k9-blitz:settings:v1";
const $ = (id) => document.getElementById(id);

const elements = {
  boardStage: $("boardStage"),
  boardViewport: $("boardViewport"),
  boardStatus: $("boardStatus"),
  pawnLayer: $("pawnLayer"),
  spaceLayer: $("spaceLayer"),
  activePlayerName: $("activePlayerName"),
  activeDogIcon: $("activeDogIcon"),
  activeDogName: $("activeDogName"),
  activeDogBreed: $("activeDogBreed"),
  roundLabel: $("roundLabel"),
  positionStat: $("positionStat"),
  tokenStat: $("tokenStat"),
  cardStat: $("cardStat"),
  dieOne: $("dieOne"),
  dieTwo: $("dieTwo"),
  diceTotal: $("diceTotal"),
  rollButton: $("rollButton"),
  turnInstruction: $("turnInstruction"),
  competitionTrack: $("competitionTrack"),
  competitionCount: $("competitionCount"),
  playerList: $("playerList"),
  historyList: $("historyList"),
  historyCount: $("historyCount"),
  setupModal: $("setupModal"),
  resumeCard: $("resumeCard"),
  resumeSummary: $("resumeSummary"),
  resumeButton: $("resumeButton"),
  playerCount: $("playerCount"),
  playerSetupList: $("playerSetupList"),
  startGameButton: $("startGameButton"),
  eventModal: $("eventModal"),
  eventIcon: $("eventIcon"),
  eventKicker: $("eventKicker"),
  eventTitle: $("eventTitle"),
  eventText: $("eventText"),
  eventEffect: $("eventEffect"),
  eventContinueButton: $("eventContinueButton"),
  helpModal: $("helpModal"),
  helpButton: $("helpButton"),
  helpCloseButton: $("helpCloseButton"),
  soundButton: $("soundButton"),
  fullscreenButton: $("fullscreenButton"),
  newGameButton: $("newGameButton"),
  zoomOutButton: $("zoomOutButton"),
  zoomInButton: $("zoomInButton"),
  zoomLabel: $("zoomLabel"),
  focusButton: $("focusButton"),
  toast: $("toast"),
  confetti: $("confetti"),
};

let state = null;
let busy = false;
let zoom = 1;
let toastTimer = null;
let aiTimer = null;
let eventResolver = null;
let audioContext = null;

const settings = readJson(SETTINGS_KEY) ?? { sound: true };
let soundEnabled = settings.sound !== false;

function readJson(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function savedGame() {
  const candidate = readJson(STORAGE_KEY);
  if (!candidate || candidate.rulesVersion !== RULES_VERSION || candidate.contentVersion !== CONTENT_VERSION) {
    return null;
  }
  if (!Array.isArray(candidate.players) || candidate.players.length < 2) return null;
  return candidate;
}

function saveGame() {
  if (!state) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ sound: soundEnabled }));
}

function dogById(id) {
  return DOGS.find((dog) => dog.id === id) ?? DOGS[0];
}

function pawnById(id) {
  return PAWNS.find((pawn) => pawn.id === id) ?? PAWNS[0];
}

function currentPlayer() {
  return state?.players?.[state.activePlayerIndex] ?? null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatHistoryTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function beep(frequency = 440, duration = 0.08, type = "sine", volume = 0.045) {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Audio is progressive enhancement only.
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 2200);
}

function createBoardMarkers() {
  elements.spaceLayer.innerHTML = "";
  for (const space of BOARD_SPACES) {
    const marker = document.createElement("span");
    marker.className = "space-marker";
    marker.dataset.spaceIndex = String(space.index);
    marker.style.left = `${space.x}%`;
    marker.style.top = `${space.y}%`;
    elements.spaceLayer.append(marker);
  }
}

function renderPawns() {
  elements.pawnLayer.innerHTML = "";
  if (!state) return;
  const collisions = new Map();
  for (const player of state.players) {
    collisions.set(player.position, (collisions.get(player.position) ?? 0) + 1);
  }
  const seenAtPosition = new Map();

  state.players.forEach((player, index) => {
    const space = BOARD_SPACES[player.position] ?? BOARD_SPACES[0];
    const pawn = pawnById(player.pawnId);
    const sameSpaceCount = collisions.get(player.position) ?? 1;
    const slot = seenAtPosition.get(player.position) ?? 0;
    seenAtPosition.set(player.position, slot + 1);
    const spread = sameSpaceCount > 1 ? (slot - (sameSpaceCount - 1) / 2) * 1.7 : 0;

    const el = document.createElement("div");
    el.className = `pawn${index === state.activePlayerIndex && state.status === "playing" ? " active" : ""}`;
    el.dataset.playerId = player.id;
    el.style.setProperty("--pawn", pawn.color);
    el.style.left = `${space.x + spread}%`;
    el.style.top = `${space.y}%`;
    el.setAttribute("aria-label", `${player.name}, ${dogById(player.dogId).name}, space ${player.position}`);
    el.innerHTML = `<span class="pawn-label">${escapeHtml(player.name)}</span>`;
    elements.pawnLayer.append(el);
  });

  document.querySelectorAll(".space-marker.active").forEach((el) => el.classList.remove("active"));
  const active = currentPlayer();
  if (active) {
    elements.spaceLayer.querySelector(`[data-space-index="${active.position}"]`)?.classList.add("active");
  }
}

function renderCompetition() {
  const player = currentPlayer();
  const progress = player?.competition ?? 0;
  elements.competitionCount.textContent = `${progress}/8`;
  elements.competitionTrack.innerHTML = COMPETITION_ICONS.map((icon, index) =>
    `<span class="competition-step${index < progress ? " done" : ""}" aria-label="Competition step ${index + 1}${index < progress ? " complete" : ""}">${icon}</span>`
  ).join("");
}

function renderPlayers() {
  if (!state) {
    elements.playerList.innerHTML = '<div class="empty-state">No game in progress.</div>';
    return;
  }
  elements.playerList.innerHTML = state.players.map((player, index) => {
    const pawn = pawnById(player.pawnId);
    const dog = dogById(player.dogId);
    const activeClass = index === state.activePlayerIndex && state.status === "playing" ? " active" : "";
    const controller = player.controllerType === "computer" ? "Computer" : "Human";
    return `<div class="player-row${activeClass}">
      <span class="player-dot" style="background:${pawn.color}"></span>
      <div><strong>${escapeHtml(player.name)} · ${escapeHtml(dog.name)}</strong><small>${controller} · ${player.tokens} 🐾 · ${player.competition}/8 🏆</small></div>
      <span class="player-score">${player.position === LAST_SPACE ? "FINISH" : `#${player.position}`}</span>
    </div>`;
  }).join("");
}

function renderHistory() {
  if (!state) {
    elements.historyCount.textContent = "0";
    elements.historyList.innerHTML = "<li>Game history will appear here.</li>";
    return;
  }
  elements.historyCount.textContent = String(state.history.length);
  const entries = [...state.history].slice(-16).reverse();
  elements.historyList.innerHTML = entries.map((entry, index) =>
    `<li class="${index === 0 ? "latest" : ""}"><span>${formatHistoryTime(entry.at)}</span> ${escapeHtml(entry.text)}</li>`
  ).join("");
}

function renderDice() {
  const dice = state?.dice;
  elements.dieOne.textContent = dice?.first ?? "–";
  elements.dieTwo.textContent = dice?.second ?? "–";
  elements.diceTotal.textContent = dice?.total ?? "—";
}

function renderTurn() {
  const player = currentPlayer();
  if (!player) {
    elements.activePlayerName.textContent = "K9 Blitz";
    elements.activeDogIcon.textContent = "🐾";
    elements.activeDogName.textContent = "Set up players to begin";
    elements.activeDogBreed.textContent = "The Ultimate Dog Training Challenge";
    elements.roundLabel.textContent = "Round —";
    elements.positionStat.textContent = "Start";
    elements.tokenStat.textContent = "0";
    elements.cardStat.textContent = "0";
    elements.boardStatus.textContent = "Ready for a new game";
    elements.rollButton.disabled = true;
    elements.turnInstruction.textContent = "Create a local game to start training.";
    return;
  }

  const dog = dogById(player.dogId);
  elements.activePlayerName.textContent = state.status === "finished" ? `${player.name}'s table` : player.name;
  elements.activeDogIcon.textContent = dog.icon;
  elements.activeDogName.textContent = dog.name;
  elements.activeDogBreed.textContent = dog.breed;
  elements.roundLabel.textContent = `Round ${state.round}`;
  elements.positionStat.textContent = player.position === 0 ? "Start" : player.position === LAST_SPACE ? "Finish" : String(player.position);
  elements.tokenStat.textContent = String(player.tokens);
  elements.cardStat.textContent = String(player.cardsDrawn);

  const winner = state.players.find((candidate) => candidate.id === state.winnerPlayerId);
  if (state.status === "finished" && winner) {
    elements.boardStatus.textContent = `${winner.name} wins K9 Blitz!`;
    elements.turnInstruction.textContent = `${winner.name} and ${dogById(winner.dogId).name} reached the Finish podium.`;
    elements.rollButton.disabled = true;
    return;
  }

  const computer = player.controllerType === "computer";
  elements.boardStatus.textContent = `${player.name}'s turn · ${dog.name}`;
  elements.rollButton.disabled = busy || computer;
  elements.turnInstruction.textContent = computer
    ? `${player.name} is a computer player and is choosing its move.`
    : busy ? "Resolving this turn…" : "Roll both dice to move your dog through Barkley Ville.";
}

function render() {
  renderTurn();
  renderDice();
  renderCompetition();
  renderPlayers();
  renderHistory();
  renderPawns();
  elements.boardStage.classList.toggle("game-won", state?.status === "finished");
}

function updateSetupRows() {
  const count = Number(elements.playerCount.value);
  const previous = Array.from(elements.playerSetupList.querySelectorAll(".player-setup-row")).map((row) => ({
    name: row.querySelector("input")?.value,
    controllerType: row.querySelector(".controller-select")?.value,
    dogId: row.querySelector(".dog-select")?.value,
  }));

  elements.playerSetupList.innerHTML = "";
  for (let index = 0; index < count; index += 1) {
    const pawn = PAWNS[index];
    const prior = previous[index] ?? {};
    const row = document.createElement("div");
    row.className = "player-setup-row";
    row.innerHTML = `
      <span class="player-number" style="background:${pawn.color}">${index + 1}</span>
      <input aria-label="Player ${index + 1} name" maxlength="18" value="${escapeHtml(prior.name || `Trainer ${index + 1}`)}" />
      <select class="controller-select" aria-label="Player ${index + 1} controller">
        <option value="human" ${prior.controllerType !== "computer" ? "selected" : ""}>Human</option>
        <option value="computer" ${prior.controllerType === "computer" ? "selected" : ""}>Computer</option>
      </select>
      <select class="dog-select" aria-label="Player ${index + 1} dog">
        ${DOGS.map((dog) => `<option value="${dog.id}" ${(prior.dogId ?? DOGS[index % DOGS.length].id) === dog.id ? "selected" : ""}>${dog.icon} ${dog.name} · ${dog.breed}</option>`).join("")}
      </select>`;
    elements.playerSetupList.append(row);
  }
}

function showSetup() {
  clearTimeout(aiTimer);
  const saved = savedGame();
  elements.resumeCard.hidden = !saved;
  if (saved) {
    const active = saved.players[saved.activePlayerIndex];
    elements.resumeSummary.textContent = `${saved.players.length} players · Round ${saved.round} · ${active?.name ?? "Trainer"}'s turn`;
  }
  updateSetupRows();
  elements.setupModal.hidden = false;
  setTimeout(() => elements.playerSetupList.querySelector("input")?.focus(), 0);
}

function hideSetup() {
  elements.setupModal.hidden = true;
}

function startGameFromSetup() {
  const rows = Array.from(elements.playerSetupList.querySelectorAll(".player-setup-row"));
  const players = rows.map((row, index) => {
    const name = row.querySelector("input").value.trim() || `Trainer ${index + 1}`;
    return {
      id: `player-${index + 1}`,
      name,
      pawnId: PAWNS[index].id,
      dogId: row.querySelector(".dog-select").value,
      controllerType: row.querySelector(".controller-select").value,
    };
  });

  try {
    state = createGame(players);
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Could not start the game.");
    return;
  }
  busy = false;
  saveGame();
  hideSetup();
  render();
  focusActivePlayer(false);
  beep(523, .09, "triangle");
  scheduleAiIfNeeded();
}

function resumeSavedGame() {
  const saved = savedGame();
  if (!saved) {
    showToast("That saved game is no longer compatible with this rules version.");
    return;
  }
  state = saved;
  busy = false;
  hideSetup();
  render();
  focusActivePlayer(false);
  scheduleAiIfNeeded();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function animateDice(finalRoll) {
  elements.dieOne.classList.add("rolling");
  elements.dieTwo.classList.add("rolling");
  for (let i = 0; i < 8; i += 1) {
    elements.dieOne.textContent = String(1 + Math.floor(Math.random() * 6));
    elements.dieTwo.textContent = String(1 + Math.floor(Math.random() * 6));
    elements.diceTotal.textContent = "…";
    beep(160 + i * 18, .025, "square", .015);
    await delay(55);
  }
  elements.dieOne.classList.remove("rolling");
  elements.dieTwo.classList.remove("rolling");
  elements.dieOne.textContent = String(finalRoll.first);
  elements.dieTwo.textContent = String(finalRoll.second);
  elements.diceTotal.textContent = String(finalRoll.total);
  beep(410, .07, "triangle", .035);
  await delay(180);
}

async function animatePlayerMovement(playerIndex, from, to) {
  if (from === to) return;
  const direction = to > from ? 1 : -1;
  for (let position = from + direction; direction > 0 ? position <= to : position >= to; position += direction) {
    const player = { ...state.players[playerIndex], position };
    state = replacePlayer(state, playerIndex, player);
    renderPawns();
    if ((Math.abs(position - from) % 2) === 0) beep(240, .025, "sine", .012);
    await delay(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 10 : 115);
  }
}

function describeSpaceEffect(before, after, space) {
  const changes = [];
  const tokenDelta = after.tokens - before.tokens;
  const compDelta = after.competition - before.competition;
  if (tokenDelta > 0) changes.push(`+${tokenDelta} Paw Token${tokenDelta === 1 ? "" : "s"}`);
  if (tokenDelta < 0) changes.push(`${tokenDelta} Paw Token`);
  if (compDelta > 0) changes.push(`+${compDelta} Competition step${compDelta === 1 ? "" : "s"}`);
  return changes.join(" · ") || (space.type === "vet" ? "Checkup complete" : "Keep going!");
}

function describeCardEffect(before, after, extraTurn) {
  const changes = [];
  const tokenDelta = after.tokens - before.tokens;
  const compDelta = after.competition - before.competition;
  const moveDelta = after.position - before.position;
  if (tokenDelta) changes.push(`${tokenDelta > 0 ? "+" : ""}${tokenDelta} Paw Token${Math.abs(tokenDelta) === 1 ? "" : "s"}`);
  if (compDelta) changes.push(`+${compDelta} Competition step${compDelta === 1 ? "" : "s"}`);
  if (moveDelta) changes.push(`${moveDelta > 0 ? "+" : ""}${moveDelta} space${Math.abs(moveDelta) === 1 ? "" : "s"}`);
  if (extraTurn) changes.push("Extra turn");
  return changes.join(" · ") || "No state change";
}

function showEvent({ icon, kicker, title, text, effect, autoContinue = false }) {
  if (eventResolver) {
    eventResolver();
    eventResolver = null;
  }
  elements.eventIcon.textContent = icon;
  elements.eventKicker.textContent = kicker;
  elements.eventTitle.textContent = title;
  elements.eventText.textContent = text;
  elements.eventEffect.textContent = effect || "";
  elements.eventEffect.hidden = !effect;
  elements.eventModal.hidden = false;
  elements.eventContinueButton.textContent = autoContinue ? "Continue" : "Continue";
  elements.eventContinueButton.focus();

  return new Promise((resolve) => {
    eventResolver = () => {
      elements.eventModal.hidden = true;
      eventResolver = null;
      resolve();
    };
    if (autoContinue) {
      setTimeout(() => eventResolver?.(), 950);
    }
  });
}

async function resolveLanding(playerIndex) {
  let player = state.players[playerIndex];
  const space = BOARD_SPACES[player.position];
  const isComputer = player.controllerType === "computer";

  if (space.type === "trainer") {
    const { card, nextCursor } = drawTrainerCard(state);
    const before = player;
    const result = applyCardEffect(player, card);
    const moveFrom = player.position;
    player = result.player;
    state = replacePlayer({ ...state, deckCursor: nextCursor, extraTurn: state.extraTurn || result.extraTurn }, playerIndex, player);
    state = appendHistory(state, `${before.name} drew “${card.title}”: ${card.text}`, "card");
    saveGame();
    render();
    await showEvent({
      icon: card.icon,
      kicker: "Trainer Card",
      title: card.title,
      text: card.text,
      effect: describeCardEffect(before, player, result.extraTurn),
      autoContinue: isComputer,
    });
    if (player.position !== moveFrom) {
      const target = player.position;
      const reset = { ...player, position: moveFrom };
      state = replacePlayer(state, playerIndex, reset);
      await animatePlayerMovement(playerIndex, moveFrom, target);
      player = state.players[playerIndex];
      state = appendHistory(state, `${player.name} moved to space ${player.position} from the Trainer Card.`, "move");
      saveGame();
      render();
    }
    return;
  }

  if (space.type === "normal") {
    showToast(`${space.title}: ${space.text}`);
    return;
  }

  const before = player;
  player = applySpaceEffect(player, space);
  state = replacePlayer(state, playerIndex, player);
  state = appendHistory(state, `${player.name} landed on ${space.title}. ${space.text}`, "space");
  saveGame();
  render();
  await showEvent({
    icon: space.type === "vet" ? "🩺" : space.type === "competition" ? "🏆" : space.type === "agility" ? "🛝" : space.type === "training" ? "🎓" : space.type === "daycare" ? "🐶" : "🐾",
    kicker: "Board Space",
    title: space.title,
    text: space.text,
    effect: describeSpaceEffect(before, player, space),
    autoContinue: isComputer,
  });
}

async function announceWinner(playerIndex) {
  const winner = state.players[playerIndex];
  state = declareWinnerIfFinished(state, playerIndex);
  state = appendHistory(state, `${winner.name} and ${dogById(winner.dogId).name} reached Finish and won K9 Blitz!`, "winner");
  saveGame();
  render();
  focusActivePlayer(true);
  celebrate();
  beep(523, .14, "triangle", .05);
  setTimeout(() => beep(659, .14, "triangle", .05), 130);
  setTimeout(() => beep(784, .3, "triangle", .05), 260);
  await showEvent({
    icon: "🏆",
    kicker: "Winner!",
    title: `${winner.name} wins!`,
    text: `${dogById(winner.dogId).name} made it to the Finish podium. Great training!`,
    effect: `${winner.tokens} Paw Tokens · ${winner.competition}/8 Competition progress`,
  });
}

async function handleRoll() {
  if (!state || busy || state.status !== "playing") return;
  const playerIndex = state.activePlayerIndex;
  const player = state.players[playerIndex];
  busy = true;
  clearTimeout(aiTimer);
  renderTurn();

  const dice = rollDice();
  await animateDice(dice);
  state = { ...state, dice };
  state = appendHistory(state, `${player.name} rolled ${dice.first} + ${dice.second} = ${dice.total}.`, "roll");
  saveGame();
  renderDice();
  renderHistory();

  const from = state.players[playerIndex].position;
  const target = advancePosition(from, dice.total);
  await animatePlayerMovement(playerIndex, from, target);
  state = appendHistory(state, `${player.name} moved from ${from === 0 ? "Start" : from} to ${target === LAST_SPACE ? "Finish" : target}.`, "move");
  saveGame();
  render();
  focusActivePlayer(true);

  if (target >= LAST_SPACE) {
    await announceWinner(playerIndex);
    busy = false;
    render();
    return;
  }

  await resolveLanding(playerIndex);
  if (state.players[playerIndex].position >= LAST_SPACE) {
    await announceWinner(playerIndex);
    busy = false;
    render();
    return;
  }

  finishTurn(playerIndex);
}

function finishTurn(previousPlayerIndex) {
  const previous = state.players[previousPlayerIndex];
  const extra = state.extraTurn;
  state = advanceTurn(state);
  state = appendHistory(
    state,
    extra ? `${previous.name} earned another turn.` : `Turn passes to ${state.players[state.activePlayerIndex].name}.`,
    "turn",
  );
  busy = false;
  saveGame();
  render();
  focusActivePlayer(true);
  scheduleAiIfNeeded();
}

function scheduleAiIfNeeded() {
  clearTimeout(aiTimer);
  const player = currentPlayer();
  if (!state || state.status !== "playing" || busy || !player || player.controllerType !== "computer") return;
  aiTimer = setTimeout(() => handleRoll(), 700);
}

function applyZoom() {
  const baseWidth = Math.max(elements.boardViewport.clientWidth, 980);
  elements.boardStage.style.width = `${Math.round(baseWidth * zoom)}px`;
  elements.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}

function focusActivePlayer(smooth = true) {
  requestAnimationFrame(() => {
    const player = currentPlayer();
    if (!player) return;
    const space = BOARD_SPACES[player.position];
    const stageWidth = elements.boardStage.clientWidth;
    const stageHeight = elements.boardStage.clientHeight;
    const targetLeft = stageWidth * space.x / 100 - elements.boardViewport.clientWidth / 2;
    const targetTop = stageHeight * space.y / 100 - elements.boardViewport.clientHeight / 2;
    elements.boardViewport.scrollTo({
      left: Math.max(0, targetLeft),
      top: Math.max(0, targetTop),
      behavior: smooth && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto",
    });
  });
}

function celebrate() {
  elements.confetti.innerHTML = "";
  const colors = ["#df4139", "#1688c9", "#3aa45c", "#f8cc3d", "#ffffff"];
  for (let i = 0; i < 70; i += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * .65}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    elements.confetti.append(piece);
  }
  setTimeout(() => { elements.confetti.innerHTML = ""; }, 4600);
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  saveSettings();
  elements.soundButton.textContent = soundEnabled ? "🔊" : "🔇";
  elements.soundButton.setAttribute("aria-pressed", String(soundEnabled));
  if (soundEnabled) beep(523, .07, "triangle");
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    showToast("Fullscreen is not available in this browser.");
  }
}

function newGame() {
  clearTimeout(aiTimer);
  if (state?.status === "playing" && !window.confirm("Start a new game? Your current saved game will be replaced when the new game begins.")) return;
  showSetup();
}

function closeHelp() {
  elements.helpModal.hidden = true;
}

// Events
elements.playerCount.addEventListener("change", updateSetupRows);
elements.startGameButton.addEventListener("click", startGameFromSetup);
elements.resumeButton.addEventListener("click", resumeSavedGame);
elements.rollButton.addEventListener("click", handleRoll);
elements.eventContinueButton.addEventListener("click", () => eventResolver?.());
elements.helpButton.addEventListener("click", () => { elements.helpModal.hidden = false; elements.helpCloseButton.focus(); });
elements.helpCloseButton.addEventListener("click", closeHelp);
elements.helpModal.addEventListener("click", (event) => { if (event.target === elements.helpModal) closeHelp(); });
elements.soundButton.addEventListener("click", toggleSound);
elements.fullscreenButton.addEventListener("click", toggleFullscreen);
elements.newGameButton.addEventListener("click", newGame);
elements.zoomInButton.addEventListener("click", () => { zoom = Math.min(1.7, zoom + .15); applyZoom(); focusActivePlayer(false); });
elements.zoomOutButton.addEventListener("click", () => { zoom = Math.max(.7, zoom - .15); applyZoom(); focusActivePlayer(false); });
elements.focusButton.addEventListener("click", () => focusActivePlayer(true));
window.addEventListener("resize", () => { applyZoom(); });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.helpModal.hidden) closeHelp();
  if (event.code === "Space" && !elements.rollButton.disabled && elements.setupModal.hidden && elements.eventModal.hidden && elements.helpModal.hidden) {
    event.preventDefault();
    handleRoll();
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) scheduleAiIfNeeded();
});

createBoardMarkers();
applyZoom();
elements.soundButton.textContent = soundEnabled ? "🔊" : "🔇";
elements.soundButton.setAttribute("aria-pressed", String(soundEnabled));
render();
showSetup();
