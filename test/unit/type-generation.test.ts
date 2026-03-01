import { describe, it, expect } from "vitest";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";

const GENERATED_FILE = resolve(
  import.meta.dirname,
  "../../src/types/generated.ts",
);

describe("Type Generation", () => {
  it("produces src/types/generated.ts", async () => {
    await expect(access(GENERATED_FILE)).resolves.toBeUndefined();
  });

  it("generated types include all 5 schemas", async () => {
    const content = await readFile(GENERATED_FILE, "utf-8");

    // Each schema should produce a type
    expect(content).toContain("configuration");
    expect(content).toContain("identity");
    expect(content).toContain("message");
    expect(content).toContain("policy");
    expect(content).toContain("tool-definition");
  });

  it("generated types have required fields from configuration schema", async () => {
    const content = await readFile(GENERATED_FILE, "utf-8");

    // RuntimeConfiguration (or Configuration) should have 4 required fields
    expect(content).toContain("memory_root");
    expect(content).toContain("provider_adapter");
    expect(content).toContain("auth_mode");
    expect(content).toContain("tool_sources");
  });

  it("generated types have required fields from identity schema", async () => {
    const content = await readFile(GENERATED_FILE, "utf-8");

    expect(content).toContain("owner");
    expect(content).toContain("collaborator");
    expect(content).toContain("system_agent");
    expect(content).toContain("background_agent");
    expect(content).toContain("external_agent");
    expect(content).toContain("service");
    expect(content).toContain("economic");
    expect(content).toContain("federated");
  });

  it("generated types have required fields from message schema", async () => {
    const content = await readFile(GENERATED_FILE, "utf-8");

    expect(content).toContain("role");
    expect(content).toContain("content");
    expect(content).toContain("tool_calls");
    expect(content).toContain("tool_call_id");
  });

  it("generated types have required fields from policy schema", async () => {
    const content = await readFile(GENERATED_FILE, "utf-8");

    expect(content).toContain("subject");
    expect(content).toContain("resource");
    expect(content).toContain("action");
    expect(content).toContain("effect");
  });

  it("generated types have required fields from tool-definition schema", async () => {
    const content = await readFile(GENERATED_FILE, "utf-8");

    expect(content).toContain("name");
    expect(content).toContain("description");
    expect(content).toContain("parameters");
  });
});
