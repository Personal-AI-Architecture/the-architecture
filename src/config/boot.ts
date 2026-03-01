/**
 * Boot Sequence
 *
 * Six phases from configuration-spec:
 * 1. Load runtime config (4 fields)
 * 2. Load adapter config (reads adapters/{name}.json)
 * 3. Discover tools (stub — returns empty, filled in Phase 1)
 * 4. Mount Your Memory (validate memory_root exists)
 * 5. Read preferences (stub — filled in Phase 1)
 * 6. Ready
 *
 * Phase 0 implements phases 1 and 4. Other phases are stubs.
 */

import { stat } from "node:fs/promises";
import { loadConfig, ConfigError } from "./loader.js";
import type { RuntimeConfig } from "../types/index.js";

export interface BootResult {
  config: RuntimeConfig;
  status: "ok";
}

export class BootError extends Error {
  phase: number;
  constructor(phase: number, message: string) {
    super(`Boot phase ${phase} failed: ${message}`);
    this.name = "BootError";
    this.phase = phase;
  }
}

/**
 * Run the boot sequence.
 *
 * Returns a BootResult if successful, throws BootError if any phase fails.
 */
export async function boot(configPath?: string): Promise<BootResult> {
  // Phase 1: Load runtime config
  let config: RuntimeConfig;
  try {
    config = await loadConfig(configPath);
  } catch (err) {
    if (err instanceof ConfigError) {
      throw new BootError(1, err.message);
    }
    throw new BootError(1, (err as Error).message);
  }

  // Phase 2: Load adapter config (stub — Phase 1C)
  // Will read adapters/{config.provider_adapter}.json

  // Phase 3: Discover tools (stub — Phase 1A)
  // Will scan config.tool_sources for tool manifests

  // Phase 4: Mount Your Memory — validate memory_root exists
  try {
    const stats = await stat(config.memory_root);
    if (!stats.isDirectory()) {
      throw new BootError(
        4,
        `memory_root is not a directory: ${config.memory_root}`,
      );
    }
  } catch (err) {
    if (err instanceof BootError) throw err;
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new BootError(
        4,
        `memory_root does not exist: ${config.memory_root}`,
      );
    }
    throw new BootError(
      4,
      `Cannot access memory_root: ${config.memory_root} — ${(err as Error).message}`,
    );
  }

  // Phase 5: Read preferences (stub — Phase 1A)
  // Will read preferences from Your Memory

  // Phase 6: Ready
  return { config, status: "ok" };
}
