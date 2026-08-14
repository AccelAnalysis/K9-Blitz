import {
  BASE_CONTENT_CATALOG,
  BASE_CONTENT_VERSION,
  CONTENT_OVERRIDE_KEY,
  validateContentCatalog,
} from "./game-data.js";

const DRAFT_KEY = "k9-blitz:content-admin:draft:v1";
const AUDIT_KEY = "k9-blitz:content-admin:audit:v1";

const categories = [
  { key: "trainerCards", label: "Trainer Cards", itemLabel: (item) => item.title, detail: (item) => item.effect?.type ?? "card" },
  { key: "dogs", label: "Dogs", itemLabel: (item) => item.name, detail: (item) => item.breed },
  { key: "boardSpaces", label: "Board Spaces", itemLabel: (item) => `${item.index}: ${item.title}`, detail: (item) => item.type },
  { key: "pawns", label: "Pawns", itemLabel: (item) => item.label, detail: (item) => item.id },
  { key: "competitionIcons", label: "Competition Track", itemLabel: (item, index) => `Step ${index + 1}: ${item}`, detail: () => "achievement" },
  { key: "help", label: "Rules & Help", itemLabel: (_, key) => key, detail: () => "help" },
  { key: "digitalRules", label: "Game Settings", itemLabel: (_, key) => key, detail: (item) => typeof item === "object" ? JSON.stringify(item) : String(item) },
];

const $ = (id) => document.getElementById(id);
const elements = {
  rulesVersion: $("rulesVersion"), contentVersion: $("contentVersion"), publishStatus: $("publishStatus"),
  categoryNav: $("categoryNav"), auditList: $("auditList"), clearAuditButton: $("clearAuditButton"),
  dashboard: $("dashboard"), categoryTitle: $("categoryTitle"), searchInput: $("searchInput"), itemList: $("itemList"),
  editorTitle: $("editorTitle"), draftStatus: $("draftStatus"), editorHint: $("editorHint"), jsonEditor: $("jsonEditor"),
  validationMessage: $("validationMessage"), revertItemButton: $("revertItemButton"), saveDraftButton: $("saveDraftButton"),
  exportButton: $("exportButton"), importInput: $("importInput"), resetButton: $("resetButton"), publishButton: $("publishButton"),
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function clone(value) {
  return structuredClone(value);
}

function activePublishedCatalog() {
  const candidate = readJson(CONTENT_OVERRIDE_KEY, null);
  return candidate && validateContentCatalog(candidate).length === 0 ? candidate : clone(BASE_CONTENT_CATALOG);
}

let catalog = readJson(DRAFT_KEY, null) ?? activePublishedCatalog();
let activeCategory = "trainerCards";
let selectedKey = null;
let audit = readJson(AUDIT_KEY, []);

function saveAudit(action, detail) {
  audit = [{ at: new Date().toISOString(), action, detail }, ...audit].slice(0, 100);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(audit));
  renderAudit();
}

function renderAudit() {
  elements.auditList.innerHTML = audit.length
    ? audit.map((entry) => `<li><strong>${escapeHtml(entry.action)}</strong><br>${escapeHtml(entry.detail)}<br><time>${new Date(entry.at).toLocaleString()}</time></li>`).join("")
    : "<li>No local changes recorded.</li>";
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function category() {
  return categories.find((candidate) => candidate.key === activeCategory) ?? categories[0];
}

function categoryEntries(key = activeCategory) {
  const value = catalog[key];
  if (Array.isArray(value)) return value.map((item, index) => ({ key: item?.id ?? String(index), sourceKey: index, item }));
  if (value && typeof value === "object") return Object.entries(value).map(([entryKey, item]) => ({ key: entryKey, sourceKey: entryKey, item }));
  return [];
}

function getSelectedEntry() {
  return categoryEntries().find((entry) => String(entry.key) === String(selectedKey)) ?? null;
}

function renderDashboard() {
  const metrics = [
    ["Dogs", catalog.dogs.length],
    ["Trainer Cards", catalog.trainerCards.length],
    ["Board Spaces", catalog.boardSpaces.length],
    ["Competition Steps", catalog.competitionIcons.length],
  ];
  elements.dashboard.innerHTML = metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");
  elements.rulesVersion.textContent = catalog.rulesVersion;
  elements.contentVersion.textContent = catalog.contentVersion;
  elements.publishStatus.textContent = localStorage.getItem(CONTENT_OVERRIDE_KEY) ? "Local publish" : "Repository baseline";
}

function renderNav() {
  elements.categoryNav.innerHTML = categories.map((item) => `<button type="button" data-category="${item.key}" class="${item.key === activeCategory ? "active" : ""}">${item.label}</button>`).join("");
  for (const button of elements.categoryNav.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      selectedKey = null;
      render();
    });
  }
}

function renderList() {
  const meta = category();
  const query = elements.searchInput.value.trim().toLowerCase();
  const entries = categoryEntries().filter((entry) => {
    const label = meta.itemLabel(entry.item, entry.sourceKey);
    const detail = meta.detail(entry.item, entry.sourceKey);
    return !query || `${label} ${detail}`.toLowerCase().includes(query);
  });
  elements.categoryTitle.textContent = meta.label;
  elements.itemList.innerHTML = entries.map((entry) => {
    const label = meta.itemLabel(entry.item, entry.sourceKey);
    const detail = meta.detail(entry.item, entry.sourceKey);
    return `<button class="item-card ${String(entry.key) === String(selectedKey) ? "active" : ""}" type="button" data-item-key="${escapeHtml(entry.key)}"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(detail)}</span></button>`;
  }).join("") || "<p>No matching records.</p>";
  for (const button of elements.itemList.querySelectorAll("button")) {
    button.addEventListener("click", () => {
      selectedKey = button.dataset.itemKey;
      renderList();
      renderEditor();
    });
  }
}

function renderEditor() {
  const entry = getSelectedEntry();
  if (!entry) {
    elements.editorTitle.textContent = "Choose an item";
    elements.editorHint.textContent = "Select a content record to edit its JSON representation.";
    elements.jsonEditor.value = "";
    elements.jsonEditor.disabled = true;
    elements.saveDraftButton.disabled = true;
    elements.revertItemButton.disabled = true;
    elements.draftStatus.textContent = localStorage.getItem(DRAFT_KEY) ? "Draft" : "Published";
    return;
  }
  elements.editorTitle.textContent = category().itemLabel(entry.item, entry.sourceKey);
  elements.editorHint.textContent = `Editing ${activeCategory}. Save Draft keeps the change local until Publish Locally is selected.`;
  elements.jsonEditor.value = JSON.stringify(entry.item, null, 2);
  elements.jsonEditor.disabled = false;
  elements.saveDraftButton.disabled = false;
  elements.revertItemButton.disabled = false;
  elements.draftStatus.textContent = "Editable";
  hideValidation();
}

function hideValidation() {
  elements.validationMessage.hidden = true;
  elements.validationMessage.textContent = "";
}

function showValidation(messages) {
  elements.validationMessage.hidden = false;
  elements.validationMessage.textContent = messages.join("\n");
}

function replaceSelectedValue(value) {
  const entry = getSelectedEntry();
  if (!entry) return;
  if (Array.isArray(catalog[activeCategory])) catalog[activeCategory][entry.sourceKey] = value;
  else catalog[activeCategory][entry.sourceKey] = value;
}

function saveDraft() {
  const entry = getSelectedEntry();
  if (!entry) return;
  let parsed;
  try {
    parsed = JSON.parse(elements.jsonEditor.value);
  } catch (error) {
    showValidation([`Invalid JSON: ${error.message}`]);
    return;
  }
  if (Array.isArray(catalog[activeCategory]) && activeCategory !== "competitionIcons" && (!parsed || typeof parsed !== "object")) {
    showValidation(["This record must remain a JSON object."]);
    return;
  }
  replaceSelectedValue(parsed);
  const problems = validateContentCatalog(catalog);
  if (problems.length) {
    replaceSelectedValue(entry.item);
    showValidation(problems.slice(0, 8));
    return;
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(catalog));
  saveAudit("DRAFT_SAVED", `${activeCategory}:${selectedKey}`);
  elements.draftStatus.textContent = "Draft";
  renderDashboard();
  renderList();
  hideValidation();
}

function revertSelected() {
  const published = activePublishedCatalog();
  const entry = getSelectedEntry();
  if (!entry) return;
  const source = Array.isArray(published[activeCategory]) ? published[activeCategory][entry.sourceKey] : published[activeCategory][entry.sourceKey];
  if (source === undefined) return;
  replaceSelectedValue(clone(source));
  localStorage.setItem(DRAFT_KEY, JSON.stringify(catalog));
  saveAudit("ITEM_REVERTED", `${activeCategory}:${selectedKey}`);
  renderEditor();
  renderList();
}

function publishLocally() {
  const problems = validateContentCatalog(catalog);
  if (problems.length) {
    showValidation(problems.slice(0, 12));
    return;
  }
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const published = clone(catalog);
  published.contentVersion = `${BASE_CONTENT_VERSION}-local.${stamp}`;
  published.rulesVersion = `${BASE_CONTENT_CATALOG.rulesVersion}-local.${stamp}`;
  published.digitalRules.id = published.rulesVersion;
  published.digitalRules.displayVersion = `1.0-local.${stamp}`;
  published.authorizationBasis = "owner-authorized-local-publish";
  published.authorizedAt = new Date().toISOString();
  localStorage.setItem(CONTENT_OVERRIDE_KEY, JSON.stringify(published));
  localStorage.removeItem(DRAFT_KEY);
  catalog = published;
  saveAudit("CONTENT_PUBLISHED", published.contentVersion);
  selectedKey = null;
  render();
  alert("Content published in this browser. Reload the game to use the new content version.");
}

function resetBaseline() {
  if (!confirm("Reset all local K9 Blitz content changes to the repository baseline?")) return;
  localStorage.removeItem(CONTENT_OVERRIDE_KEY);
  localStorage.removeItem(DRAFT_KEY);
  catalog = clone(BASE_CONTENT_CATALOG);
  selectedKey = null;
  saveAudit("BASELINE_RESTORED", BASE_CONTENT_VERSION);
  render();
}

function exportCatalog() {
  const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `k9-blitz-${catalog.contentVersion}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  saveAudit("CONTENT_EXPORTED", catalog.contentVersion);
}

async function importCatalog(file) {
  if (!file) return;
  try {
    const candidate = JSON.parse(await file.text());
    const problems = validateContentCatalog(candidate);
    if (problems.length) {
      showValidation(problems.slice(0, 12));
      return;
    }
    catalog = candidate;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(catalog));
    selectedKey = null;
    saveAudit("CONTENT_IMPORTED", file.name);
    render();
  } catch (error) {
    showValidation([`Import failed: ${error.message}`]);
  } finally {
    elements.importInput.value = "";
  }
}

function render() {
  renderDashboard();
  renderNav();
  renderList();
  renderEditor();
  renderAudit();
}

elements.searchInput.addEventListener("input", renderList);
elements.saveDraftButton.addEventListener("click", saveDraft);
elements.revertItemButton.addEventListener("click", revertSelected);
elements.publishButton.addEventListener("click", publishLocally);
elements.resetButton.addEventListener("click", resetBaseline);
elements.exportButton.addEventListener("click", exportCatalog);
elements.importInput.addEventListener("change", () => importCatalog(elements.importInput.files?.[0]));
elements.clearAuditButton.addEventListener("click", () => {
  audit = [];
  localStorage.removeItem(AUDIT_KEY);
  renderAudit();
});

render();
