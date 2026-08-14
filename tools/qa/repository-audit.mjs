import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverSourceFiles, discoverTests } from "./test-discovery.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const failures = [];

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

const requiredPaths = [
  "AGENTS.md",
  "docs/DIGITAL_RULES_V1.md",
  "docs/architecture/ADR-0001-authoritative-game-engine.md",
  "docs/architecture/ADR-0002-owner-authorized-digital-rules.md",
  "docs/architecture/ADR-0003-github-pages-runtime-boundary.md",
  "docs/architecture/TECHNICAL_ARCHITECTURE.md",
  "docs/quality/DEFINITION_OF_DONE.md",
  "docs/quality/QA_STRATEGY.md",
  "docs/quality/TEST_MATRIX.md",
  "docs/quality/RELEASE_GATES.md",
  ".github/workflows/ci.yml",
  ".github/workflows/pages.yml",
  "apps/web/index.html",
  "apps/web/game-data.js",
  "apps/web/game-engine.js",
  "packages/game-engine/src/engine.ts"
];

for (const path of requiredPaths) if (!(await exists(join(repoRoot, path)))) failures.push(`Missing required architecture/QA artifact: ${path}`);

const testFiles = await discoverTests(repoRoot);
const packageEntries = await readdir(join(repoRoot, "packages"), { withFileTypes: true });
for (const entry of packageEntries) {
  if (!entry.isDirectory()) continue;
  const packagePath = `packages/${entry.name}`;
  const srcPath = join(repoRoot, packagePath, "src");
  if (!(await exists(srcPath))) continue;
  const sources = (await discoverSourceFiles(srcPath)).filter((file) => !/\.(?:test|spec)\./.test(file));
  if (sources.length && !testFiles.some((file) => file.startsWith(`${packagePath}/`))) failures.push(`${packagePath} contains source code but no discovered automated tests.`);
}

const engineRoot = join(repoRoot, "packages/game-engine/src");
for (const file of await discoverSourceFiles(engineRoot)) {
  if (/\.(?:test|spec)\./.test(file)) continue;
  const source = await readFile(file, "utf8");
  const relativePath = relative(repoRoot, file).split(sep).join("/");
  const importPattern = /(?:from\s+|import\s*\()\s*["']([^"']+)["']/g;
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith(".") && !specifier.startsWith("node:")) failures.push(`${relativePath} imports non-domain dependency ${specifier}.`);
  }
  if (!relativePath.endsWith("/random.ts") && source.includes("Math.random(")) failures.push(`${relativePath} uses Math.random outside the explicit RandomSource implementation.`);
}

const rootPackage = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8"));
for (const script of ["test", "typecheck", "qa:repo", "build:pages", "qa"]) if (!rootPackage.scripts?.[script]) failures.push(`Root package.json is missing required script: ${script}`);

const ci = await readFile(join(repoRoot, ".github/workflows/ci.yml"), "utf8");
if (!ci.includes("npm run qa")) failures.push("CI workflow must execute the canonical npm run qa gate.");
const pages = await readFile(join(repoRoot, ".github/workflows/pages.yml"), "utf8");
if (!pages.includes("npm run qa")) failures.push("Pages verification must execute the canonical npm run qa gate.");
if (!pages.includes("npm run build:pages")) failures.push("Pages deployment must use the canonical build:pages artifact builder.");

if (failures.length) {
  console.error("Repository architecture/QA audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Repository audit passed: ${testFiles.length} test files discovered across ${packageEntries.filter((entry) => entry.isDirectory()).length} packages.`);
