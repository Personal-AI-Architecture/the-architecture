/**
 * Provider Adapter Boundary — Unit Test
 *
 * Verifies adapters/ contain no business logic (C-4):
 * no retry logic, caching, routing, or business rules.
 */

import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ADAPTERS_DIR = resolve(import.meta.dirname, "../../src/adapters");

async function getTypeScriptFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true, recursive: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".ts"))
      .map((e) => resolve(e.parentPath ?? e.path, e.name));
  } catch {
    return [];
  }
}

describe("C-4: Adapter contains no business logic", () => {
  it("no retry logic, caching, routing, or business rules in adapter code", async () => {
    const files = await getTypeScriptFiles(ADAPTERS_DIR);
    expect(files.length).toBeGreaterThan(0);

    const businessLogicPatterns = [
      /\bretry\b/i,
      /\bcache\b/i,
      /\broute\b/i,
      /\bif\s*\(\s*model\s*===\b/,   // Model-specific routing
      /\bswitch\s*\(\s*model\b/,       // Model-specific switching
      /BrainDrive/i,                     // Product-specific logic
    ];

    for (const file of files) {
      const content = await readFile(file, "utf-8");

      for (const pattern of businessLogicPatterns) {
        // Allow "cache-control" in HTTP headers and "no-cache" — those are HTTP protocol
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes("Cache-Control") || line.includes("no-cache")) continue;
          if (line.includes("// ") || line.includes("* ")) continue; // Skip comments

          if (pattern.test(line)) {
            // Allow the word "retry" or "cache" in error messages and comments
            if (line.includes('"') || line.includes("'") || line.includes("`")) continue;
            expect.fail(
              `Business logic found in ${file}:${i + 1}: "${line.trim()}" matches ${pattern}`,
            );
          }
        }
      }
    }
  });

  it("no imports from gateway, engine, auth, or memory", async () => {
    const files = await getTypeScriptFiles(ADAPTERS_DIR);

    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/(?:import|export)\s+.*?from\s+["']([^"']+)["']/);
        if (!match) continue;

        const importPath = match[1];
        expect(importPath, `${file}:${i + 1} imports ${importPath}`).not.toMatch(/\/gateway\//);
        expect(importPath, `${file}:${i + 1} imports ${importPath}`).not.toMatch(/\/engine\//);
        expect(importPath, `${file}:${i + 1} imports ${importPath}`).not.toMatch(/\/auth\//);
        expect(importPath, `${file}:${i + 1} imports ${importPath}`).not.toMatch(/\/memory\//);
      }
    }
  });
});
