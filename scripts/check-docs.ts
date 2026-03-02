/**
 * Documentation Freshness Check
 *
 * Validates doc-registry.json integrity and detects stale documentation
 * by comparing changed files against doc coverage patterns.
 *
 * Exit codes:
 *   0 — All docs fresh (or only Tier 3 stale in default mode)
 *   1 — Tier 3 docs stale (only in --strict mode)
 *   2 — Tier 1 or 2 docs stale, or registry validation failed
 *
 * Run: npm run check:docs
 * Run: npm run check:docs:strict
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");
const REGISTRY_PATH = join(ROOT, "docs", "doc-registry.json");
const STRICT = process.argv.includes("--strict");

// --- Types ---

interface DocEntry {
  path: string;
  covers: string[];
  tier: 1 | 2 | 3;
  update_trigger: "code" | "spec" | "manual";
  depends_on: string[];
}

interface Registry {
  docs: DocEntry[];
}

interface StaleResult {
  doc: DocEntry;
  coverMatches: string[];
  dependsOnMatches: string[];
}

interface ValidationError {
  message: string;
}

// --- Registry Loading ---

async function loadRegistry(): Promise<Registry> {
  const content = await readFile(REGISTRY_PATH, "utf-8");
  return JSON.parse(content) as Registry;
}

// --- Registry Validation ---

async function getExpectedPaths(): Promise<Set<string>> {
  const paths = new Set<string>();

  // docs/**/*.md
  try {
    const entries = await readdir(join(ROOT, "docs"), {
      withFileTypes: true,
      recursive: true,
    });
    for (const entry of entries) {
      if (
        entry.isFile() &&
        entry.name.endsWith(".md") &&
        !entry.name.endsWith(".json")
      ) {
        const fullPath = resolve(entry.parentPath ?? entry.path, entry.name);
        paths.add(relative(ROOT, fullPath));
      }
    }
  } catch {
    // docs/ doesn't exist
  }

  // *.md at repo root
  const rootEntries = await readdir(ROOT, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      paths.add(entry.name);
    }
  }

  return paths;
}

async function validateRegistry(
  registry: Registry,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const registeredPaths = new Set(registry.docs.map((d) => d.path));

  // 1. Every markdown file must have a registry entry
  const expectedPaths = await getExpectedPaths();
  for (const mdPath of expectedPaths) {
    if (!registeredPaths.has(mdPath)) {
      errors.push({ message: `Missing registry entry: ${mdPath}` });
    }
  }
  for (const docPath of registeredPaths) {
    if (!expectedPaths.has(docPath)) {
      errors.push({
        message: `Registry entry for non-existent file: ${docPath}`,
      });
    }
  }

  // 2. Every covers entry must resolve to an existing file or directory
  for (const doc of registry.docs) {
    for (const cover of doc.covers) {
      const fullPath = resolve(ROOT, cover);
      try {
        await stat(fullPath);
      } catch {
        errors.push({
          message: `${doc.path}: covers entry does not exist: ${cover}`,
        });
      }
    }
  }

  // 3. Every depends_on entry must resolve to a registered doc
  for (const doc of registry.docs) {
    for (const dep of doc.depends_on) {
      if (!registeredPaths.has(dep)) {
        errors.push({
          message: `${doc.path}: depends_on non-registered doc: ${dep}`,
        });
      }
    }
  }

  // 4. No circular dependencies
  errors.push(...detectCycles(registry));

  return errors;
}

function detectCycles(registry: Registry): ValidationError[] {
  const errors: ValidationError[] = [];
  const graph = new Map<string, string[]>();
  for (const doc of registry.docs) {
    graph.set(doc.path, doc.depends_on);
  }

  const WHITE = 0; // unvisited
  const GRAY = 1; // in current DFS path
  const BLACK = 2; // fully processed

  const color = new Map<string, number>();
  for (const doc of registry.docs) {
    color.set(doc.path, WHITE);
  }

  function dfs(node: string, path: string[]): void {
    color.set(node, GRAY);
    path.push(node);

    for (const dep of graph.get(node) ?? []) {
      if (color.get(dep) === GRAY) {
        const cycleStart = path.indexOf(dep);
        const cycle = path.slice(cycleStart).concat(dep);
        errors.push({
          message: `Circular dependency: ${cycle.join(" → ")}`,
        });
      } else if (color.get(dep) === WHITE) {
        dfs(dep, path);
      }
    }

    path.pop();
    color.set(node, BLACK);
  }

  for (const doc of registry.docs) {
    if (color.get(doc.path) === WHITE) {
      dfs(doc.path, []);
    }
  }

  return errors;
}

// --- Git Integration ---

function getChangedFiles(): string[] {
  const changed = new Set<string>();

  try {
    // Find merge base with main
    let mergeBase: string;
    try {
      mergeBase = execSync("git merge-base HEAD main", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      try {
        mergeBase = execSync("git merge-base HEAD origin/main", {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
      } catch {
        return [];
      }
    }

    // Committed changes since merge base
    const head = execSync("git rev-parse HEAD", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    if (mergeBase !== head) {
      const committed = execSync(
        `git diff --name-only ${mergeBase}..HEAD`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
      ).trim();
      for (const f of committed.split("\n")) {
        if (f.trim()) changed.add(f.trim());
      }
    }

    // Staged changes
    const staged = execSync("git diff --name-only --cached", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    for (const f of staged.split("\n")) {
      if (f.trim()) changed.add(f.trim());
    }

    // Unstaged changes
    const unstaged = execSync("git diff --name-only", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    for (const f of unstaged.split("\n")) {
      if (f.trim()) changed.add(f.trim());
    }
  } catch {
    // Not in a git repo or git not available
    return [];
  }

  return [...changed];
}

// --- Staleness Detection ---

function matchesCover(filePath: string, cover: string): boolean {
  if (cover.endsWith("/")) {
    return filePath.startsWith(cover);
  }
  return filePath === cover;
}

function checkStaleness(
  registry: Registry,
  changedFiles: string[],
): StaleResult[] {
  const changedSet = new Set(changedFiles);
  const stale: StaleResult[] = [];

  for (const doc of registry.docs) {
    // Manual docs are never auto-flagged
    if (doc.update_trigger === "manual") continue;

    // Skip if the doc itself was modified in this changeset
    if (changedSet.has(doc.path)) continue;

    // Check covers — did any covered code change?
    const coverMatches: string[] = [];
    for (const file of changedFiles) {
      for (const cover of doc.covers) {
        if (matchesCover(file, cover)) {
          coverMatches.push(file);
          break;
        }
      }
    }

    // Check depends_on — did any dependency doc change?
    const dependsOnMatches: string[] = [];
    for (const dep of doc.depends_on) {
      if (changedSet.has(dep)) {
        dependsOnMatches.push(dep);
      }
    }

    if (coverMatches.length > 0 || dependsOnMatches.length > 0) {
      stale.push({ doc, coverMatches, dependsOnMatches });
    }
  }

  return stale;
}

// --- Output ---

function tierAction(tier: number): string {
  switch (tier) {
    case 1:
      return "Tier 1 — update required before merge";
    case 2:
      return "Tier 2 — update required before merge";
    case 3:
      return "Tier 3 — AI agent will auto-update";
    default:
      return `Tier ${tier}`;
  }
}

function printResults(
  registry: Registry,
  staleResults: StaleResult[],
  changedFiles: string[],
): void {
  console.log("check:docs — documentation freshness check\n");

  const stalePaths = new Set(staleResults.map((r) => r.doc.path));

  // Stale docs first
  for (const result of staleResults) {
    console.log(`  STALE  ${result.doc.path}`);
    if (result.coverMatches.length > 0) {
      console.log(`         covers: ${result.doc.covers.join(", ")}`);
      console.log(`         changed: ${result.coverMatches.join(", ")}`);
    }
    if (result.dependsOnMatches.length > 0) {
      console.log(
        `         depends_on: ${result.dependsOnMatches.join(", ")} (modified)`,
      );
    }
    console.log(`         action: ${tierAction(result.doc.tier)}`);
    console.log();
  }

  // Fresh docs
  for (const doc of registry.docs) {
    if (doc.update_trigger === "manual") continue;
    if (stalePaths.has(doc.path)) continue;
    console.log(`  OK     ${doc.path}`);
  }

  // Manual docs
  const manualDocs = registry.docs.filter(
    (d) => d.update_trigger === "manual",
  );
  if (manualDocs.length > 0) {
    console.log();
    for (const doc of manualDocs) {
      console.log(`  SKIP   ${doc.path} (manual)`);
    }
  }

  // Summary
  const freshCount = registry.docs.filter(
    (d) => d.update_trigger !== "manual" && !stalePaths.has(d.path),
  ).length;
  const manualCount = manualDocs.length;

  console.log();
  console.log(
    `  Result: ${staleResults.length} stale, ${freshCount} fresh, ${manualCount} manual`,
  );

  if (changedFiles.length === 0) {
    console.log("  Status: PASS (no changes detected)");
  } else {
    const hasTier12 = staleResults.some((r) => r.doc.tier <= 2);
    const hasTier3 = staleResults.some((r) => r.doc.tier === 3);

    if (hasTier12) {
      console.log(
        "  Status: FAIL (Tier 1/2 docs require update before merge)",
      );
    } else if (hasTier3) {
      console.log("  Status: WARN (Tier 3 docs should be updated)");
    } else {
      console.log("  Status: PASS");
    }
  }
}

// --- Main ---

async function main(): Promise<void> {
  // Load registry
  let registry: Registry;
  try {
    registry = await loadRegistry();
  } catch (err) {
    console.error(`check:docs — failed to load registry: ${err}`);
    process.exit(2);
  }

  // Validate registry integrity
  const validationErrors = await validateRegistry(registry);

  if (validationErrors.length > 0) {
    console.error("check:docs — registry validation FAILED\n");
    for (const err of validationErrors) {
      console.error(`  ERROR  ${err.message}`);
    }
    process.exit(2);
  }

  // Get changed files
  const changedFiles = getChangedFiles();

  // Check staleness
  const staleResults = checkStaleness(registry, changedFiles);

  // Output
  printResults(registry, staleResults, changedFiles);

  // Exit code
  const hasTier12 = staleResults.some((r) => r.doc.tier <= 2);
  const hasTier3Only =
    !hasTier12 && staleResults.some((r) => r.doc.tier === 3);

  if (hasTier12) {
    process.exit(2);
  } else if (hasTier3Only && STRICT) {
    process.exit(1);
  }
  process.exit(0);
}

main();
