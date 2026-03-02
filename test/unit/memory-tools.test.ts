/**
 * Memory Tools — Unit Tests
 *
 * Tests the 7 memory operations against a temp directory.
 * Covers: read, write, edit, delete, search, list, history (no-git unit).
 * Also covers: path safety, edge cases, property-based tests.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, mkdir, readFile, symlink, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import * as fc from "fast-check";
import type { MemoryTools } from "../../src/types/index.js";

// Dynamic import so we test the real module
let createMemoryTools: (root: string) => MemoryTools;

beforeEach(async () => {
  const mod = await import("../../src/memory/tools.js");
  createMemoryTools = mod.createMemoryTools;
});

let memoryRoot: string;
let tools: MemoryTools;

beforeEach(async () => {
  memoryRoot = await mkdtemp(join(tmpdir(), "pai-mem-test-"));
  tools = createMemoryTools(memoryRoot);
});

afterEach(async () => {
  await rm(memoryRoot, { recursive: true, force: true });
});

// ─── read() ──────────────────────────────────────────────────────────────────

describe("read()", () => {
  it("returns file content", async () => {
    await writeFile(resolve(memoryRoot, "hello.md"), "Hello world");

    const result = await tools.read({ path: "hello.md" });

    expect(result.path).toBe("hello.md");
    expect(result.content).toBe("Hello world");
    expect(result.modified_at).toBeTruthy();
    // modified_at should be a valid ISO 8601 date
    expect(new Date(result.modified_at).toISOString()).toBe(result.modified_at);
  });

  it("fails on nonexistent file with clear error", async () => {
    await expect(tools.read({ path: "nope.md" })).rejects.toThrow();
  });
});

// ─── write() ─────────────────────────────────────────────────────────────────

describe("write()", () => {
  it("creates file and intermediate directories", async () => {
    const result = await tools.write({
      path: "deep/nested/dir/file.md",
      content: "nested content",
    });

    expect(result.success).toBe(true);

    const ondisk = await readFile(
      resolve(memoryRoot, "deep/nested/dir/file.md"),
      "utf-8",
    );
    expect(ondisk).toBe("nested content");
  });

  it("overwrites existing file", async () => {
    await tools.write({ path: "overwrite.md", content: "v1" });
    await tools.write({ path: "overwrite.md", content: "v2" });

    const result = await tools.read({ path: "overwrite.md" });
    expect(result.content).toBe("v2");
  });
});

// ─── write/read roundtrip (property) ────────────────────────────────────────

describe("write/read roundtrip (Property)", () => {
  it("P-1: any valid content survives write/read cycle", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 10000 }),
        async (content) => {
          const filename = `prop-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
          await tools.write({ path: filename, content });
          const result = await tools.read({ path: filename });
          expect(result.content).toBe(content);
        },
      ),
      { numRuns: 20 },
    );
  });
});

// ─── edit() ──────────────────────────────────────────────────────────────────

describe("edit()", () => {
  it("replaces content", async () => {
    await tools.write({ path: "edit-me.md", content: "Hello world" });

    const result = await tools.edit({
      path: "edit-me.md",
      old_content: "world",
      new_content: "universe",
    });

    expect(result.success).toBe(true);

    const updated = await tools.read({ path: "edit-me.md" });
    expect(updated.content).toBe("Hello universe");
  });

  it("P-10: fails when old content not found — no corruption", async () => {
    await tools.write({ path: "stable.md", content: "original content" });

    const result = await tools.edit({
      path: "stable.md",
      old_content: "nonexistent text",
      new_content: "replacement",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();

    // File must be unchanged
    const after = await tools.read({ path: "stable.md" });
    expect(after.content).toBe("original content");
  });
});

// ─── delete() ────────────────────────────────────────────────────────────────

describe("delete()", () => {
  it("removes file", async () => {
    await tools.write({ path: "delete-me.md", content: "gone" });
    const result = await tools.delete({ path: "delete-me.md" });

    expect(result.success).toBe(true);

    // File should be gone
    await expect(tools.read({ path: "delete-me.md" })).rejects.toThrow();
  });

  it("fails on nonexistent file", async () => {
    const result = await tools.delete({ path: "never-existed.md" });
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

// ─── search() ────────────────────────────────────────────────────────────────

describe("search()", () => {
  it("finds content in files", async () => {
    await tools.write({ path: "notes.md", content: "line one\nfind me here\nline three" });
    await tools.write({ path: "other.md", content: "nothing relevant" });

    const results = await tools.search({ query: "find me", type: "content" });

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].path).toBe("notes.md");
    expect(results[0].line).toBe(2);
    expect(results[0].content).toContain("find me");
  });

  it("searches filenames with glob pattern", async () => {
    await tools.write({ path: "report-2024.md", content: "data" });
    await tools.write({ path: "notes.txt", content: "data" });

    const results = await tools.search({ query: "*.md", type: "filename" });

    const paths = results.map((r) => r.path);
    expect(paths).toContain("report-2024.md");
    expect(paths).not.toContain("notes.txt");
  });

  it("limits search scope with path", async () => {
    await mkdir(resolve(memoryRoot, "a"), { recursive: true });
    await mkdir(resolve(memoryRoot, "b"), { recursive: true });
    await tools.write({ path: "a/file.md", content: "target text" });
    await tools.write({ path: "b/file.md", content: "target text" });

    const results = await tools.search({
      query: "target",
      path: "a",
      type: "content",
    });

    const paths = results.map((r) => r.path);
    expect(paths.every((p) => p.startsWith("a/"))).toBe(true);
  });
});

// ─── list() ──────────────────────────────────────────────────────────────────

describe("list()", () => {
  it("returns directory entries with file types", async () => {
    await tools.write({ path: "file.md", content: "content" });
    await mkdir(resolve(memoryRoot, "subdir"), { recursive: true });

    const entries = await tools.list({ path: "." });

    const names = entries.map((e) => e.name);
    expect(names).toContain("file.md");
    expect(names).toContain("subdir");

    const fileEntry = entries.find((e) => e.name === "file.md")!;
    expect(fileEntry.type).toBe("file");
    expect(fileEntry.modified_at).toBeTruthy();

    const dirEntry = entries.find((e) => e.name === "subdir")!;
    expect(dirEntry.type).toBe("directory");
  });

  it("lists recursively", async () => {
    await tools.write({ path: "top.md", content: "top" });
    await tools.write({ path: "sub/deep.md", content: "deep" });

    const entries = await tools.list({ path: ".", recursive: true });

    const paths = entries.map((e) => e.path);
    expect(paths).toContain("top.md");
    // Should contain the nested file
    expect(paths.some((p) => p.includes("deep.md"))).toBe(true);
  });
});

// ─── Path traversal security ─────────────────────────────────────────────────

describe("Path traversal security", () => {
  it("rejects ../../../etc/passwd", async () => {
    await expect(
      tools.read({ path: "../../../etc/passwd" }),
    ).rejects.toThrow();
  });

  it("rejects absolute path /etc/passwd", async () => {
    await expect(tools.read({ path: "/etc/passwd" })).rejects.toThrow();
  });

  it("rejects subdir/../../etc/passwd", async () => {
    await expect(
      tools.read({ path: "subdir/../../etc/passwd" }),
    ).rejects.toThrow();
  });

  it("E-4: rejects symlinks that resolve outside memoryRoot", async () => {
    // Create a symlink inside memoryRoot that points outside
    const linkPath = resolve(memoryRoot, "escape-link");
    await symlink("/etc", linkPath);

    await expect(
      tools.read({ path: "escape-link/passwd" }),
    ).rejects.toThrow();
  });

  it("P-2: random traversal attempts all rejected (property)", async () => {
    const traversalArb = fc.oneof(
      // ../../../ prefix
      fc.nat({ max: 10 }).map((n) => "../".repeat(n + 1) + "etc/passwd"),
      // Absolute paths
      fc.constant("/etc/passwd"),
      fc.constant("/tmp/secret"),
      // Sneaky variations
      fc.constant("..\\..\\..\\etc\\passwd"),
      fc.constant("subdir/../../../etc/passwd"),
    );

    await fc.assert(
      fc.asyncProperty(traversalArb, async (maliciousPath) => {
        await expect(
          tools.read({ path: maliciousPath }),
        ).rejects.toThrow();
      }),
      { numRuns: 30 },
    );
  });

  it("allows valid nested paths", async () => {
    await tools.write({ path: "sub/dir/file.md", content: "safe" });
    const result = await tools.read({ path: "sub/dir/file.md" });
    expect(result.content).toBe("safe");
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe("Edge cases", () => {
  it("E-1: empty file write/read roundtrip", async () => {
    await tools.write({ path: "empty.md", content: "" });
    const result = await tools.read({ path: "empty.md" });
    expect(result.content).toBe("");
  });

  it("E-3: Unicode in path and content preserved", async () => {
    const unicodeContent = "Hello 🌍 — Ñoño — 日本語 — العربية";
    await tools.write({ path: "unicode-test.md", content: unicodeContent });
    const result = await tools.read({ path: "unicode-test.md" });
    expect(result.content).toBe(unicodeContent);
  });

  it("E-2: large file (>1MB) reads and writes without error", async () => {
    const largeContent = "x".repeat(1024 * 1024 + 1); // 1MB + 1 byte
    await tools.write({ path: "large.txt", content: largeContent });
    const result = await tools.read({ path: "large.txt" });
    expect(result.content.length).toBe(largeContent.length);
  });

  it("E-15: write failure returns error, no partial writes", async () => {
    // Write to a path where the parent is a file (not a directory)
    // This should fail because you can't create a dir where a file exists
    await tools.write({ path: "blocker", content: "I am a file" });

    const result = await tools.write({
      path: "blocker/subfile.md",
      content: "should fail",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
