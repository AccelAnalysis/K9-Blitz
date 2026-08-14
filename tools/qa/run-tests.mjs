import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { discoverDistBuildPackages, discoverTests } from "./test-discovery.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const testFiles = await discoverTests(repoRoot);

if (testFiles.length === 0) {
  console.error("QA failed: no tests were discovered.");
  process.exit(1);
}

const buildPackages = await discoverDistBuildPackages(repoRoot, testFiles);
for (const packageDir of buildPackages) {
  const tsconfig = join(repoRoot, packageDir, "tsconfig.json");
  try {
    await access(tsconfig);
  } catch {
    console.error(`QA failed: ${packageDir} tests import dist output but no tsconfig.json exists.`);
    process.exit(1);
  }

  console.log(`Building test prerequisite: ${packageDir}`);
  const build = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["--yes", "--package", "typescript@6.0.2", "tsc", "-p", `${packageDir}/tsconfig.json`],
    { cwd: repoRoot, stdio: "inherit" },
  );
  if (build.status !== 0) process.exit(build.status ?? 1);
}

console.log(`Running ${testFiles.length} discovered test files.`);
const result = spawnSync(process.execPath, ["--test", ...testFiles], { cwd: repoRoot, stdio: "inherit" });
process.exit(result.status ?? 1);
