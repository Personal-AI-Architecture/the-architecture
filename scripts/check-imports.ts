/**
 * Import Boundary Checker
 *
 * Enforces architectural boundaries by scanning import statements:
 * - src/engine/ must NOT import from src/gateway/ or src/auth/
 * - src/auth/ must NOT import from src/gateway/ or src/engine/
 * - src/gateway/ must NOT import from src/engine/ internals (only the interface)
 * - src/memory/ must NOT import from any other component
 *
 * Run: npm run check:imports
 */

import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const SRC_DIR = resolve(import.meta.dirname, "../src");

interface Violation {
  file: string;
  line: number;
  importPath: string;
  rule: string;
}

const RULES: Array<{
  sourceDir: string;
  forbiddenDirs: string[];
  description: string;
}> = [
  {
    sourceDir: "engine",
    forbiddenDirs: ["gateway", "auth"],
    description: "Engine must not import Gateway or Auth",
  },
  {
    sourceDir: "auth",
    forbiddenDirs: ["gateway", "engine"],
    description: "Auth must not import Gateway or Engine",
  },
  {
    sourceDir: "gateway",
    forbiddenDirs: ["engine", "auth"],
    description: "Gateway must not import Engine or Auth internals",
  },
  {
    sourceDir: "memory",
    forbiddenDirs: ["engine", "gateway", "auth", "adapters"],
    description: "Memory must not import any other component",
  },
];

async function getFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, {
      withFileTypes: true,
      recursive: true,
    });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".ts")) {
        const fullPath = resolve(entry.parentPath ?? entry.path, entry.name);
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist yet — that's fine
  }
  return files;
}

async function checkFile(
  filePath: string,
  forbiddenDirs: string[],
  description: string,
): Promise<Violation[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match import/export from statements
    const match = line.match(
      /(?:import|export)\s+.*?from\s+["']([^"']+)["']/,
    );
    if (!match) continue;

    const importPath = match[1];
    for (const forbidden of forbiddenDirs) {
      if (
        importPath.includes(`/${forbidden}/`) ||
        importPath.includes(`../${forbidden}`)
      ) {
        violations.push({
          file: relative(SRC_DIR, filePath),
          line: i + 1,
          importPath,
          rule: description,
        });
      }
    }
  }

  return violations;
}

async function main() {
  const allViolations: Violation[] = [];

  for (const rule of RULES) {
    const dir = resolve(SRC_DIR, rule.sourceDir);
    const files = await getFiles(dir);

    for (const file of files) {
      const violations = await checkFile(
        file,
        rule.forbiddenDirs,
        rule.description,
      );
      allViolations.push(...violations);
    }
  }

  if (allViolations.length === 0) {
    console.log("Import boundary check: PASS (zero violations)");
    process.exit(0);
  }

  console.error(
    `Import boundary check: FAIL (${allViolations.length} violations)`,
  );
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line} — imports "${v.importPath}"`);
    console.error(`    Rule: ${v.rule}`);
  }
  process.exit(1);
}

main();
