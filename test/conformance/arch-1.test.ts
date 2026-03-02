/**
 * ARCH-1 Conformance Test
 *
 * "Your Memory is readable without running the system."
 *
 * This test proves that data stored by the memory tools uses standard
 * formats that any tool can read — no proprietary encoding, no running
 * system needed.
 *
 * 1. Write files via memory tools
 * 2. Read them back with raw fs (not through tools) — standard files
 * 3. Verify git history with raw git commands — standard version control
 *
 * The system is NOT started. We only use createMemoryTools() to write data,
 * then verify with standard tools.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  mkdtemp,
  rm,
  readFile,
  readdir,
} from "node:fs/promises";
import { join, resolve } from "node:path";
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
  memoryRoot = await mkdtemp(join(tmpdir(), "pai-arch1-test-"));

  // Initialize git
  const git = simpleGit(memoryRoot);
  await git.init();
  await git.addConfig("user.email", "test@test.com");
  await git.addConfig("user.name", "Test");

  tools = createMemoryTools(memoryRoot);
});

afterEach(async () => {
  await rm(memoryRoot, { recursive: true, force: true });
});

describe("ARCH-1: Memory readable without running system", () => {
  it("files written by memory tools are plain files readable with fs", async () => {
    // Write files via the memory tools
    await tools.write({
      path: "notes/project.md",
      content: "# My Project\n\nThis is a project note.",
    });
    await tools.write({
      path: "preferences.json",
      content: JSON.stringify({ theme: "dark", model: "gpt-4" }, null, 2),
    });

    // Read them back with raw fs — NO tool involvement
    const markdown = await readFile(
      resolve(memoryRoot, "notes/project.md"),
      "utf-8",
    );
    expect(markdown).toBe("# My Project\n\nThis is a project note.");

    const prefs = JSON.parse(
      await readFile(resolve(memoryRoot, "preferences.json"), "utf-8"),
    );
    expect(prefs.theme).toBe("dark");

    // Directory listing with raw fs
    const entries = await readdir(resolve(memoryRoot, "notes"));
    expect(entries).toContain("project.md");
  });

  it("git history is accessible with standard git commands", async () => {
    // Write and commit via tools + git
    await tools.write({ path: "versioned.md", content: "version 1" });
    const git = simpleGit(memoryRoot);
    await git.add("versioned.md");
    await git.commit("first version");

    await tools.write({ path: "versioned.md", content: "version 2" });
    await git.add("versioned.md");
    await git.commit("second version");

    // Read history with raw git — NOT through memory tools
    const log = await git.log({ file: "versioned.md" });

    expect(log.all.length).toBeGreaterThanOrEqual(2);
    expect(log.all[0].message).toContain("second version");
    expect(log.all[1].message).toContain("first version");
  });

  it("no proprietary encoding — files are plain text", async () => {
    const content = "Just plain text with Unicode: 日本語 🌍";
    await tools.write({ path: "plain.txt", content });

    // Raw read — should be identical, no encoding layer
    const raw = await readFile(resolve(memoryRoot, "plain.txt"), "utf-8");
    expect(raw).toBe(content);
  });
});
