/**
 * Memory Git Integration Tests
 *
 * Tests git-backed versioning: write → commit → history().
 * Also covers concurrent writes and git-not-installed edge case.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import simpleGit from "simple-git";
import type { MemoryTools } from "../../src/types/index.js";

let createMemoryTools: (root: string) => MemoryTools;

beforeEach(async () => {
  const mod = await import("../../src/memory/tools.js");
  createMemoryTools = mod.createMemoryTools;
});

let memoryRoot: string;
let tools: MemoryTools;

beforeEach(async () => {
  memoryRoot = await mkdtemp(join(tmpdir(), "pai-git-test-"));

  // Initialize a git repo in the temp dir
  const git = simpleGit(memoryRoot);
  await git.init();
  await git.addConfig("user.email", "test@test.com");
  await git.addConfig("user.name", "Test");

  tools = createMemoryTools(memoryRoot);
});

afterEach(async () => {
  await rm(memoryRoot, { recursive: true, force: true });
});

describe("history() with git", () => {
  it("returns commits after write + git commit", async () => {
    // Write a file
    await tools.write({ path: "versioned.md", content: "version 1" });

    // Commit it via git
    const git = simpleGit(memoryRoot);
    await git.add("versioned.md");
    await git.commit("initial commit");

    // history() should show the commit
    const entries = await tools.history({ path: "versioned.md" });

    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].message).toContain("initial commit");
    expect(entries[0].hash).toBeTruthy();
    expect(entries[0].author).toBeTruthy();
    expect(entries[0].timestamp).toBeTruthy();
  });

  it("returns multiple commits in order", async () => {
    const git = simpleGit(memoryRoot);

    await tools.write({ path: "multi.md", content: "v1" });
    await git.add("multi.md");
    await git.commit("first");

    await tools.write({ path: "multi.md", content: "v2" });
    await git.add("multi.md");
    await git.commit("second");

    await tools.write({ path: "multi.md", content: "v3" });
    await git.add("multi.md");
    await git.commit("third");

    const entries = await tools.history({ path: "multi.md" });

    expect(entries.length).toBeGreaterThanOrEqual(3);
    // Most recent first
    expect(entries[0].message).toContain("third");
  });

  it("respects limit parameter", async () => {
    const git = simpleGit(memoryRoot);

    await tools.write({ path: "limited.md", content: "v1" });
    await git.add("limited.md");
    await git.commit("c1");

    await tools.write({ path: "limited.md", content: "v2" });
    await git.add("limited.md");
    await git.commit("c2");

    await tools.write({ path: "limited.md", content: "v3" });
    await git.add("limited.md");
    await git.commit("c3");

    const entries = await tools.history({ path: "limited.md", limit: 2 });

    expect(entries.length).toBe(2);
  });
});

describe("E-5: Concurrent writes", () => {
  it("two simultaneous writes — no corruption, deterministic result", async () => {
    // Write the same file concurrently
    const [r1, r2] = await Promise.all([
      tools.write({ path: "race.md", content: "writer-A" }),
      tools.write({ path: "race.md", content: "writer-B" }),
    ]);

    // Both should report success (last write wins)
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    // File should contain one of the two values, not corrupted
    const result = await tools.read({ path: "race.md" });
    expect(["writer-A", "writer-B"]).toContain(result.content);
  });
});

describe("E-14: Git not available", () => {
  it("history() fails gracefully when not a git repo", async () => {
    // Create a fresh temp dir that is NOT a git repo
    const nonGitRoot = await mkdtemp(join(tmpdir(), "pai-nogit-test-"));
    const nonGitTools = createMemoryTools(nonGitRoot);

    // Write a file (should work fine — no git needed)
    await nonGitTools.write({ path: "test.md", content: "no git here" });

    // history() should fail with a clear error
    await expect(
      nonGitTools.history({ path: "test.md" }),
    ).rejects.toThrow();

    // Other operations should still work
    const readResult = await nonGitTools.read({ path: "test.md" });
    expect(readResult.content).toBe("no git here");

    await rm(nonGitRoot, { recursive: true, force: true });
  });
});
