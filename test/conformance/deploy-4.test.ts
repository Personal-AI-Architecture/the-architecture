/**
 * DEPLOY-4: No Silent Outbound Traffic
 *
 * "Zero network traffic except explicit provider API calls."
 *
 * With a mock provider, there should be ZERO outbound network calls.
 * No telemetry, no analytics, no phone-home, no implicit external dependencies.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

describe("DEPLOY-4: No silent outbound — zero implicit network traffic", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-deploy4-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("source code has no telemetry, analytics, or phone-home calls", async () => {
    const srcDir = resolve(import.meta.dirname, "../../src");
    const srcFiles = await collectTsFiles(srcDir);

    const suspiciousPatterns = [
      /telemetry/i,
      /analytics/i,
      /phone.?home/i,
      /tracking/i,
      /sentry/i,
      /mixpanel/i,
      /amplitude/i,
      /segment\./i,
      /posthog/i,
    ];

    for (const file of srcFiles) {
      const content = await readFile(file, "utf-8");
      for (const pattern of suspiciousPatterns) {
        expect(
          pattern.test(content),
          `${file} contains suspicious pattern: ${pattern}`,
        ).toBe(false);
      }
    }
  });

  it("only the provider adapter makes outbound HTTP calls", async () => {
    const srcDir = resolve(import.meta.dirname, "../../src");
    const srcFiles = await collectTsFiles(srcDir);

    for (const file of srcFiles) {
      const content = await readFile(file, "utf-8");

      // Skip the adapter files — they're SUPPOSED to make HTTP calls
      if (file.includes("/adapters/")) continue;

      // No other file should use fetch() or http.request()
      // Allow import statements and type references
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip imports, type annotations, and comments
        if (
          line.trimStart().startsWith("import") ||
          line.trimStart().startsWith("//") ||
          line.trimStart().startsWith("*") ||
          line.trimStart().startsWith("type")
        ) {
          continue;
        }

        // Check for fetch() calls (but not `app.fetch` which is Hono's test helper)
        if (/(?<!app\.)(?<!\.)\bfetch\s*\(/.test(line) && !line.includes("app.fetch")) {
          expect.fail(
            `${file}:${i + 1} contains fetch() call outside of adapter: ${line.trim()}`,
          );
        }
      }
    }
  });
});

async function collectTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectTsFiles(fullPath)));
    } else if (entry.name.endsWith(".ts")) {
      files.push(fullPath);
    }
  }
  return files;
}
