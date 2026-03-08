/**
 * Gateway + Auth Import Boundary Tests
 *
 * Verifies architectural boundaries post-integration:
 * - Gateway imports agent loop interface only, not internals (S-2, PR-1)
 * - Auth remains independent of gateway/agent loop (D60, X-3)
 * - Agent Loop remains independent of gateway/auth
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC_ROOT = resolve(import.meta.dirname, "../../src");

function getAllTsFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

function getImports(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const importRegex = /(?:import|from)\s+["']([^"']+)["']/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function hasImportsFrom(dir: string, forbidden: string[]): string[] {
  const violations: string[] = [];
  const files = getAllTsFiles(dir);

  for (const file of files) {
    const imports = getImports(file);
    for (const imp of imports) {
      for (const forbiddenPath of forbidden) {
        if (imp.includes(forbiddenPath) && !imp.includes("/types/")) {
          violations.push(`${file}: imports "${imp}"`);
        }
      }
    }
  }

  return violations;
}

describe("Gateway import boundary (S-2, PR-1)", () => {
  it("gateway/ does not import from agent loop internals", () => {
    const gatewayDir = join(SRC_ROOT, "gateway");

    try {
      statSync(gatewayDir);
    } catch {
      // Gateway dir doesn't exist yet — test passes vacuously
      return;
    }

    const violations = hasImportsFrom(gatewayDir, ["../engine/", "./engine/"]);
    expect(violations).toEqual([]);
  });

  it("gateway/ does not import from auth/", () => {
    const gatewayDir = join(SRC_ROOT, "gateway");

    try {
      statSync(gatewayDir);
    } catch {
      return;
    }

    const violations = hasImportsFrom(gatewayDir, ["../auth/", "./auth/"]);
    expect(violations).toEqual([]);
  });
});

describe("Auth independence (D60, X-3)", () => {
  it("auth/ does not import from gateway/", () => {
    const authDir = join(SRC_ROOT, "auth");
    const violations = hasImportsFrom(authDir, ["../gateway/", "./gateway/"]);
    expect(violations).toEqual([]);
  });

  it("auth/ does not import from agent loop", () => {
    const authDir = join(SRC_ROOT, "auth");
    const violations = hasImportsFrom(authDir, ["../engine/", "./engine/"]);
    expect(violations).toEqual([]);
  });
});

describe("Agent Loop independence (D39)", () => {
  it("engine/ does not import from gateway/", () => {
    const engineDir = join(SRC_ROOT, "engine");
    const violations = hasImportsFrom(engineDir, [
      "../gateway/",
      "./gateway/",
    ]);
    expect(violations).toEqual([]);
  });

  it("engine/ does not import from auth/ (Agent Loop boundary)", () => {
    const engineDir = join(SRC_ROOT, "engine");
    const violations = hasImportsFrom(engineDir, ["../auth/", "./auth/"]);
    expect(violations).toEqual([]);
  });
});
