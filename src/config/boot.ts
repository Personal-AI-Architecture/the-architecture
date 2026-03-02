/**
 * Boot Sequence
 *
 * Six phases from configuration-spec:
 * 1. Load runtime config (4 fields)
 * 2. Load adapter config (reads adapters/{name}.json)
 * 3. Discover tools (scan config.tool_sources for tool manifests)
 * 4. Mount Your Memory (validate memory_root exists)
 * 5. Read preferences (read preferences.json from Your Memory)
 * 6. Ready
 */

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig, ConfigError } from "./loader.js";
import { loadAdapterConfig, resolveApiKey } from "../adapters/loader.js";
import type { AdapterConfig } from "../adapters/openai-compatible.js";
import { discoverExternalTools } from "../engine/tool-executor.js";
import type { RuntimeConfig, ToolDefinition } from "../types/index.js";

export interface BootResult {
  config: RuntimeConfig;
  adapterConfig: AdapterConfig | null;
  discoveredTools: ToolDefinition[];
  preferences: Record<string, unknown>;
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
 * Phases 2, 3, and 5 are lenient — missing adapter configs, empty tool
 * sources, and absent preferences are not errors. The system boots in
 * degraded mode (mock provider, no external tools, default preferences).
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

  // Phase 2: Load adapter config
  // Lenient: if adapter config is missing or API key unset, return null
  // (server falls back to mock provider for offline mode)
  let adapterConfig: AdapterConfig | null = null;
  try {
    const rawConfig = await loadAdapterConfig(config.provider_adapter);
    const apiKey = resolveApiKey(rawConfig);
    adapterConfig = {
      name: rawConfig.name,
      base_url: rawConfig.base_url,
      api_key: apiKey,
      default_model: rawConfig.default_model,
    };
  } catch {
    // Adapter config missing or API key not set — offline mode
  }

  // Phase 3: Discover tools
  // Lenient: missing tool source directories are silently skipped
  let discoveredTools: ToolDefinition[] = [];
  try {
    discoveredTools = await discoverExternalTools(config.tool_sources);
  } catch {
    // Tool discovery failure is non-fatal
  }

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

  // Phase 5: Read preferences from Your Memory
  // Lenient: if preferences.json doesn't exist, use empty defaults
  let preferences: Record<string, unknown> = {};
  try {
    const prefsPath = resolve(config.memory_root, "preferences.json");
    const raw = await readFile(prefsPath, "utf-8");
    preferences = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // No preferences file — use defaults
  }

  // Phase 6: Ready
  return { config, adapterConfig, discoveredTools, preferences, status: "ok" };
}
