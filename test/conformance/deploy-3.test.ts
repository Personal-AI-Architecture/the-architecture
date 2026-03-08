/**
 * DEPLOY-3: Default Localhost
 *
 * "Gateway binds to localhost only — not exposed to network by default."
 *
 * Supplements Phase 3 deploy tests with conformance-level verification.
 * The server must bind to 127.0.0.1 by default, never 0.0.0.0.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

describe("DEPLOY-3: Default localhost — gateway binds to 127.0.0.1 only", () => {
  let memoryRoot: string;

  beforeEach(async () => {
    memoryRoot = await mkdtemp(join(tmpdir(), "pai-deploy3-"));
  });

  afterEach(async () => {
    await rm(memoryRoot, { recursive: true, force: true });
  });

  it("server.ts startServer binds to 127.0.0.1", async () => {
    // Static analysis: verify the source code binds to 127.0.0.1
    const serverSource = await readFile(
      resolve(import.meta.dirname, "../../src/gateway/server.ts"),
      "utf-8",
    );

    // The listen call must specify 127.0.0.1
    expect(serverSource).toContain('"127.0.0.1"');

    // Must NOT contain 0.0.0.0 (bind to all interfaces)
    expect(serverSource).not.toContain('"0.0.0.0"');
    expect(serverSource).not.toContain("'0.0.0.0'");
  });

  it("no configuration option to bind to all interfaces in the architecture", async () => {
    // Static analysis: configuration schema should not include a host field
    // that defaults to 0.0.0.0. The architecture is localhost only.
    const configSchema = await readFile(
      resolve(import.meta.dirname, "../../specs/schemas/configuration.json"),
      "utf-8",
    );

    const schema = JSON.parse(configSchema);
    // If host is in the schema, it must not default to 0.0.0.0
    if (schema.properties?.host) {
      expect(schema.properties.host.default).not.toBe("0.0.0.0");
    }
  });
});
