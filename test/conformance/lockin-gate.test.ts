/**
 * Lock-In Gate: 13 CI Checks
 *
 * All 13 checks from lockin-gate.md as automated assertions.
 * These are the mandatory PR gate checks that ensure zero lock-in.
 */

import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { resolve, join } from "node:path";

const SRC_DIR = resolve(import.meta.dirname, "../../src");
const ROOT_DIR = resolve(import.meta.dirname, "../..");

async function collectTsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(resolve(entry.parentPath ?? entry.path, entry.name));
    }
  }
  return files;
}

async function allSourceContent(): Promise<Array<{ file: string; content: string }>> {
  const files = await collectTsFiles(SRC_DIR);
  return Promise.all(
    files.map(async (f) => ({
      file: f.replace(ROOT_DIR + "/", ""),
      content: await readFile(f, "utf-8"),
    })),
  );
}

describe("Lock-In Gate: 13 mandatory checks", () => {
  // 1. Memory remains owner-portable
  it("check 1: memory data uses standard formats (files + SQLite)", async () => {
    // Memory tools write plain files — verified by ARCH-1
    // Conversation store uses SQLite — inspectable with standard tools
    const convStoreSource = await readFile(
      join(SRC_DIR, "gateway/conversation-store.ts"),
      "utf-8",
    );
    expect(convStoreSource).toContain("better-sqlite3");

    // No proprietary encoding in memory tools
    const memoryToolsSource = await readFile(
      join(SRC_DIR, "memory/tools.ts"),
      "utf-8",
    );
    // Uses standard fs operations
    expect(memoryToolsSource).toContain("node:fs/promises");
    // No custom binary encoding
    expect(memoryToolsSource).not.toMatch(/Buffer\.from.*(?:binary|hex)/);
  });

  // 2. Memory remains inspectable
  it("check 2: memory tools use standard fs + git (inspectable when not running)", async () => {
    const memoryToolsSource = await readFile(
      join(SRC_DIR, "memory/tools.ts"),
      "utf-8",
    );
    expect(memoryToolsSource).toContain("readFile");
    expect(memoryToolsSource).toContain("writeFile");

    // Git for versioning
    const memoryToolsContent = memoryToolsSource;
    expect(memoryToolsContent).toContain("simple-git");
  });

  // 3. No component-internal coupling
  it("check 3: components interact only through defined interfaces", async () => {
    const sources = await allSourceContent();

    // Agent Loop must not import Gateway or Auth
    const engineFiles = sources.filter((s) => s.file.startsWith("src/engine/"));
    for (const f of engineFiles) {
      expect(f.content, `${f.file} imports gateway`).not.toMatch(
        /from\s+["'].*\/gateway\//,
      );
      expect(f.content, `${f.file} imports auth`).not.toMatch(
        /from\s+["'].*\/auth\//,
      );
    }

    // Auth must not import Gateway or Agent Loop
    const authFiles = sources.filter((s) => s.file.startsWith("src/auth/"));
    for (const f of authFiles) {
      expect(f.content, `${f.file} imports gateway`).not.toMatch(
        /from\s+["'].*\/gateway\//,
      );
      expect(f.content, `${f.file} imports engine`).not.toMatch(
        /from\s+["'].*\/engine\//,
      );
    }

    // Memory must not import any other component
    const memoryFiles = sources.filter((s) => s.file.startsWith("src/memory/"));
    for (const f of memoryFiles) {
      expect(f.content, `${f.file} imports engine`).not.toMatch(
        /from\s+["'].*\/engine\//,
      );
      expect(f.content, `${f.file} imports gateway`).not.toMatch(
        /from\s+["'].*\/gateway\//,
      );
      expect(f.content, `${f.file} imports auth`).not.toMatch(
        /from\s+["'].*\/auth\//,
      );
    }
  });

  // 4. No hardcoded provider/model/tool decisions in core code
  it("check 4: no hardcoded provider URLs or model names in source", async () => {
    const sources = await allSourceContent();

    const hardcodedPatterns = [
      /api\.openai\.com/i,
      /api\.anthropic\.com/i,
      /api\.openrouter\.ai/i,
      /\bgpt-4\b/i,
      /\bgpt-3\.5\b/i,
      /\bclaude-3\b/i,
      /\bclaude-opus\b/i,
      /\bclaude-sonnet\b/i,
    ];

    for (const f of sources) {
      const nonCommentLines = f.content
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          return !trimmed.startsWith("//") && !trimmed.startsWith("*");
        })
        .join("\n");

      for (const pattern of hardcodedPatterns) {
        expect(
          pattern.test(nonCommentLines),
          `${f.file} contains hardcoded: ${pattern}`,
        ).toBe(false);
      }
    }
  });

  // 5. Adapter boundary preserved
  it("check 5: protocol-specific behavior stays in adapters", async () => {
    const sources = await allSourceContent();

    // Non-adapter files should not reference OpenAI-specific format
    const nonAdapterFiles = sources.filter(
      (s) => !s.file.includes("/adapters/") && !s.file.includes("/types/"),
    );

    for (const f of nonAdapterFiles) {
      // Check for OpenAI-specific field names that should live in adapters
      const nonCommentContent = f.content
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          return !trimmed.startsWith("//") && !trimmed.startsWith("*");
        })
        .join("\n");

      expect(
        /chat\/completions/.test(nonCommentContent),
        `${f.file} references OpenAI endpoint path`,
      ).toBe(false);
    }
  });

  // 6. Config-only swap claim still true
  it("check 6: provider adapter is loaded from config, not hardcoded", async () => {
    // The config schema includes provider_adapter as a field
    const configSchema = await readFile(
      join(ROOT_DIR, "specs/schemas/configuration.json"),
      "utf-8",
    );
    const schema = JSON.parse(configSchema);
    expect(schema.properties).toHaveProperty("provider_adapter");

    // Server uses config to determine behavior
    const serverSource = await readFile(
      join(SRC_DIR, "gateway/server.ts"),
      "utf-8",
    );
    expect(serverSource).toContain("config");
  });

  // 7. Offline path still valid
  it("check 7: mock provider exists for offline testing", async () => {
    const mockSource = await readFile(
      join(SRC_DIR, "adapters/mock.ts"),
      "utf-8",
    );
    // Mock provider implements ProviderAdapter without network
    expect(mockSource).toContain("ProviderAdapter");
    expect(mockSource).not.toContain("fetch(");
    expect(mockSource).not.toContain("http.request");
  });

  // 8. Local-first deployment still valid
  it("check 8: single-machine deployment supported", async () => {
    const serverSource = await readFile(
      join(SRC_DIR, "gateway/server.ts"),
      "utf-8",
    );
    // Server can run locally
    expect(serverSource).toContain("127.0.0.1");
    // Boot from local config
    expect(serverSource).toContain("boot(");
  });

  // 9. Default network posture unchanged
  it("check 9: localhost-only by default", async () => {
    const serverSource = await readFile(
      join(SRC_DIR, "gateway/server.ts"),
      "utf-8",
    );
    expect(serverSource).toContain('"127.0.0.1"');
    expect(serverSource).not.toContain('"0.0.0.0"');
  });

  // 10. No new silent outbound traffic
  it("check 10: no telemetry or analytics in source", async () => {
    const sources = await allSourceContent();
    const keywords = ["telemetry", "analytics", "tracking", "phone-home", "sentry"];

    for (const f of sources) {
      for (const keyword of keywords) {
        expect(
          f.content.toLowerCase().includes(keyword),
          `${f.file} contains "${keyword}"`,
        ).toBe(false);
      }
    }
  });

  // 11. No secrets in source or owner memory files
  it("check 11: no secrets in source code", async () => {
    const sources = await allSourceContent();

    const secretPatterns = [
      /sk-[a-zA-Z0-9]{20,}/,
      /AKIA[A-Z0-9]{16}/,
      /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
    ];

    for (const f of sources) {
      for (const pattern of secretPatterns) {
        expect(
          pattern.test(f.content),
          `${f.file} contains what looks like a secret: ${pattern}`,
        ).toBe(false);
      }
    }
  });

  // 12. Update safety preserved
  it("check 12: no irreversible migration in source", async () => {
    const sources = await allSourceContent();

    // No DROP TABLE or destructive schema changes
    for (const f of sources) {
      expect(
        /DROP\s+TABLE/i.test(f.content),
        `${f.file} contains DROP TABLE`,
      ).toBe(false);
    }

    // SQLite schema uses IF NOT EXISTS (safe for re-runs)
    const convStoreSource = await readFile(
      join(SRC_DIR, "gateway/conversation-store.ts"),
      "utf-8",
    );
    expect(convStoreSource).toContain("IF NOT EXISTS");
  });

  // 13. Architecture boundary respected
  it("check 13: no implementation product opinions in architecture code", async () => {
    const sources = await allSourceContent();

    for (const f of sources) {
      const nonCommentContent = f.content
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          return !trimmed.startsWith("//") && !trimmed.startsWith("*");
        })
        .join("\n");

      // No BrainDrive product name in code
      expect(
        /\bBrainDrive\b/.test(nonCommentContent),
        `${f.file} references BrainDrive (implementation product)`,
      ).toBe(false);

      // No managed hosting references
      expect(
        /managed.?hosting/i.test(nonCommentContent),
        `${f.file} references managed hosting (implementation)`,
      ).toBe(false);
    }
  });
});
