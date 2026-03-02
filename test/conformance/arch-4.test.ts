/**
 * ARCH-4: Schema Conformance
 *
 * "All payloads validate against canonical JSON schemas."
 *
 * Every message, tool definition, configuration, identity, and policy
 * used in the system must validate against the canonical schemas in
 * specs/schemas/. This ensures the contracts are real, not just TypeScript
 * types that compile but drift from the canonical definitions.
 */

import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type {
  Message,
  ToolDefinition,
} from "../../src/types/index.js";
import { memoryToolDefinitions } from "../../src/memory/registry.js";

const schemasDir = resolve(import.meta.dirname, "../../specs/schemas");

async function loadSchema(name: string): Promise<object> {
  const raw = await readFile(resolve(schemasDir, `${name}.json`), "utf-8");
  return JSON.parse(raw) as object;
}

function createValidator() {
  const ajv = new Ajv2020();
  addFormats(ajv);
  return ajv;
}

describe("ARCH-4: Schema conformance — payloads validate against canonical schemas", () => {
  it("Message objects validate against message.json schema", async () => {
    const schema = await loadSchema("message");
    const validate = createValidator().compile(schema);

    const validMessages: Message[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
      { role: "system", content: "You are a helpful assistant" },
      {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: "call-1",
            name: "memory_read",
            arguments: { path: "test.md" },
          },
        ],
      },
      {
        role: "tool",
        content: '{"path":"test.md","content":"hello"}',
        tool_call_id: "call-1",
      },
    ];

    for (const message of validMessages) {
      const valid = validate(message);
      expect(valid, `Message ${JSON.stringify(message)} should validate: ${JSON.stringify(validate.errors)}`).toBe(true);
    }
  });

  it("ToolDefinition objects validate against tool-definition.json schema", async () => {
    const schema = await loadSchema("tool-definition");
    const validate = createValidator().compile(schema);

    // Built-in memory tools must validate
    for (const tool of memoryToolDefinitions) {
      const valid = validate(tool);
      expect(valid, `Tool ${tool.name} should validate: ${JSON.stringify(validate.errors)}`).toBe(true);
    }

    // A custom external tool should also validate
    const externalTool: ToolDefinition = {
      name: "echo",
      description: "Echoes input",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to echo" },
        },
        required: ["text"],
      },
    };
    expect(validate(externalTool)).toBe(true);
  });

  it("RuntimeConfig validates against configuration.json schema", async () => {
    const schema = await loadSchema("configuration");
    const validate = createValidator().compile(schema);

    // Schema requires: memory_root, provider_adapter, auth_mode, tool_sources
    const validConfig = {
      memory_root: "/home/user/brain",
      provider_adapter: "openrouter",
      auth_mode: "local",
      tool_sources: ["/home/user/brain/tools"],
    };

    const valid = validate(validConfig);
    expect(valid, `Config should validate: ${JSON.stringify(validate.errors)}`).toBe(true);
  });

  it("Identity objects validate against identity.json schema", async () => {
    const schema = await loadSchema("identity");
    const validate = createValidator().compile(schema);

    // Schema requires: id, type, display_name, status, created
    const ownerIdentity = {
      id: "owner_abc123",
      type: "owner",
      display_name: "Dave",
      status: "active",
      created: "2026-01-15T10:30:00Z",
    };

    const valid = validate(ownerIdentity);
    expect(valid, `Identity should validate: ${JSON.stringify(validate.errors)}`).toBe(true);
  });

  it("Policy objects validate against policy.json schema", async () => {
    const schema = await loadSchema("policy");
    const validate = createValidator().compile(schema);

    // Schema requires: subject, resource, action, effect
    const policy = {
      subject: "owner_abc123",
      resource: "memory:*",
      action: "*",
      effect: "allow",
    };

    const valid = validate(policy);
    expect(valid, `Policy should validate: ${JSON.stringify(validate.errors)}`).toBe(true);
  });

  it("invalid payloads are rejected by schemas", async () => {
    const messageSchema = await loadSchema("message");
    const validateMessage = createValidator().compile(messageSchema);

    // Missing required 'role'
    expect(validateMessage({ content: "no role" })).toBe(false);

    // Missing required 'content'
    expect(validateMessage({ role: "user" })).toBe(false);

    // Invalid role
    expect(validateMessage({ role: "invalid", content: "test" })).toBe(false);

    // Completely wrong type
    expect(validateMessage("not an object")).toBe(false);
    expect(validateMessage(42)).toBe(false);
    expect(validateMessage(null)).toBe(false);
  });
});
