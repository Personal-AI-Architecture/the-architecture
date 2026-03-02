/**
 * Auth Boundary — Unit Test
 *
 * Verifies auth/ has zero imports from gateway/ or engine/.
 */

import { describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const AUTH_DIR = resolve(import.meta.dirname, "../../src/auth");

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

describe("Import boundary: auth/", () => {
  it("S-2: zero imports from gateway/ or engine/", async () => {
    const files = await getTypeScriptFiles(AUTH_DIR);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = await readFile(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/(?:import|export)\s+.*?from\s+["']([^"']+)["']/);
        if (!match) continue;

        const importPath = match[1];
        expect(importPath, `${file}:${i + 1} imports ${importPath}`).not.toMatch(
          /\/gateway\//,
        );
        expect(importPath, `${file}:${i + 1} imports ${importPath}`).not.toMatch(
          /\/engine\//,
        );
      }
    }
  });
});
