import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const IGNORED_DIRS = new Set([".git", "node_modules", "dist", "_site", "coverage"]);
const TEST_PATTERN = /\.(?:test|spec)\.(?:js|mjs|cjs|ts|mts|cts)$/;

async function walk(directory, files = []) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") return files;
    throw error;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) await walk(join(directory, entry.name), files);
      continue;
    }
    if (entry.isFile()) files.push(join(directory, entry.name));
  }
  return files;
}

export async function discoverTests(repoRoot) {
  const roots = ["packages", "apps", "tools"];
  const files = [];
  for (const root of roots) await walk(join(repoRoot, root), files);
  return files
    .filter((file) => TEST_PATTERN.test(file))
    .map((file) => relative(repoRoot, file).split(sep).join("/"))
    .sort();
}

export async function discoverDistBuildPackages(repoRoot, testFiles) {
  const packages = new Set();
  for (const testFile of testFiles) {
    const parts = testFile.split("/");
    if (parts[0] !== "packages" || !parts[1]) continue;
    const source = await readFile(join(repoRoot, testFile), "utf8");
    if (/\b(?:from|import\s*\()\s*["'][^"']*\/dist\//.test(source)) packages.add(`packages/${parts[1]}`);
  }
  return [...packages].sort();
}

export async function discoverSourceFiles(directory, extensions = new Set([".ts", ".tsx", ".js", ".mjs"])) {
  const files = await walk(directory, []);
  return files.filter((file) => {
    const dot = file.lastIndexOf(".");
    return dot >= 0 && extensions.has(file.slice(dot));
  });
}
