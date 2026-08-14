const BOARD = { width: 1600, height: 900 };

const locations = [
  ["START", 0.01, 0.76, 0.17, 0.2],
  ["FINISH", 0.82, 0.74, 0.17, 0.23],
  ["Pawsitive Park", 0.12, 0.17, 0.23, 0.2],
  ["Barkley Ville", 0.43, 0.31, 0.15, 0.16],
  ["Draw Trainer Cards", 0.34, 0.42, 0.09, 0.17],
  ["K9 Competition Track", 0.565, 0.42, 0.09, 0.17],
  ["Competition Progress", 0.365, 0.62, 0.27, 0.055],
  ["The Beach", 0.81, 0.76, 0.19, 0.24],
];

const referencePawns = [
  ["red", 0.068, 0.81],
  ["blue", 0.102, 0.785],
  ["green", 0.133, 0.825],
  ["yellow", 0.31, 0.87],
  ["brown", 0.225, 0.855],
];

const viewport = document.querySelector("[data-viewport]");
const stage = document.querySelector("[data-stage]");
const overlay = document.querySelector("[data-overlay]");
const pawns = document.querySelector("[data-pawns]");
const status = document.querySelector("[data-status]");

let scale = 1;
let x = 0;
let y = 0;
let dragging = false;
let origin = null;

function renderTransform() { stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`; }
function fit() {
  const box = viewport.getBoundingClientRect();
  scale = Math.min(box.width / BOARD.width, box.height / BOARD.height) * 0.96;
  x = (box.width - BOARD.width * scale) / 2;
  y = (box.height - BOARD.height * scale) / 2;
  renderTransform();
}
function zoomAt(nextScale, clientX, clientY) {
  const box = viewport.getBoundingClientRect();
  const px = clientX - box.left;
  const py = clientY - box.top;
  const boardX = (px - x) / scale;
  const boardY = (py - y) / scale;
  scale = Math.max(0.25, Math.min(4, nextScale));
  x = px - boardX * scale;
  y = py - boardY * scale;
  renderTransform();
}

for (const [name, lx, ly, width, height] of locations) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "hit-region";
  button.style.left = `${lx * 100}%`;
  button.style.top = `${ly * 100}%`;
  button.style.width = `${width * 100}%`;
  button.style.height = `${height * 100}%`;
  button.innerHTML = `<span>${name}</span>`;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    status.textContent = `${name} — visual landmark from the supplied reference photo; gameplay behavior is intentionally not inferred here.`;
  });
  overlay.append(button);
}

for (const [color, px, py] of referencePawns) {
  const marker = document.createElement("div");
  marker.className = `pawn ${color}`;
  marker.style.left = `${px * 100}%`;
  marker.style.top = `${py * 100}%`;
  marker.title = `${color} pawn reference`;
  marker.textContent = "🐾";
  pawns.append(marker);
}

document.querySelector('[data-action="debug"]').addEventListener("change", (event) => { overlay.classList.toggle("debug", event.target.checked); });
overlay.classList.add("debug");
document.querySelector('[data-action="fit"]').addEventListener("click", fit);
document.querySelector('[data-action="zoom-in"]').addEventListener("click", () => { const box = viewport.getBoundingClientRect(); zoomAt(scale * 1.2, box.left + box.width / 2, box.top + box.height / 2); });
document.querySelector('[data-action="zoom-out"]').addEventListener("click", () => { const box = viewport.getBoundingClientRect(); zoomAt(scale / 1.2, box.left + box.width / 2, box.top + box.height / 2); });
viewport.addEventListener("wheel", (event) => { event.preventDefault(); zoomAt(scale * Math.exp(-event.deltaY * 0.0012), event.clientX, event.clientY); }, { passive: false });
viewport.addEventListener("pointerdown", (event) => {
  if (event.target.closest?.(".hit-region")) return;
  dragging = true;
  viewport.classList.add("dragging");
  viewport.setPointerCapture(event.pointerId);
  origin = { clientX: event.clientX, clientY: event.clientY, x, y };
});
viewport.addEventListener("pointermove", (event) => {
  if (!dragging || !origin) return;
  x = origin.x + event.clientX - origin.clientX;
  y = origin.y + event.clientY - origin.clientY;
  renderTransform();
});
viewport.addEventListener("pointerup", (event) => {
  if (!dragging) return;
  const moved = origin && Math.hypot(event.clientX - origin.clientX, event.clientY - origin.clientY) > 4;
  dragging = false;
  origin = null;
  viewport.classList.remove("dragging");
  if (!moved) {
    const box = viewport.getBoundingClientRect();
    const nx = (event.clientX - box.left - x) / (BOARD.width * scale);
    const ny = (event.clientY - box.top - y) / (BOARD.height * scale);
    if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) status.textContent = `Normalized board coordinate: x=${nx.toFixed(4)}, y=${ny.toFixed(4)}`;
  }
});
window.addEventListener("resize", fit);
fit();
