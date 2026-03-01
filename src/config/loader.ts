/**
 * Configuration Loader
 *
 * Reads config.json from CWD or PAI_CONFIG env var, validates against
 * the canonical configuration schema, returns typed RuntimeConfig.
 *
 * The runtime config is the thin bootstrap — 4 fields that describe
 * the environment, not the user. Preferences live in Your Memory.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import Ajv from "ajv/dist/2020.js";
import type { RuntimeConfig } from "../types/index.js";

// Load the canonical schema at module level
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const configSchema = require("../../specs/schemas/configuration.json") as Record<string, unknown>;

const ajv = new (Ajv as unknown as typeof Ajv.default)({ allErrors: true });
const validate = ajv.compile(configSchema);

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Load and validate the runtime configuration.
 *
 * Resolution order:
 * 1. PAI_CONFIG env var (absolute path to config.json)
 * 2. config.json in CWD
 */
export async function loadConfig(
  configPath?: string,
): Promise<RuntimeConfig> {
  const resolvedPath =
    configPath ??
    process.env.PAI_CONFIG ??
    resolve(process.cwd(), "config.json");

  let raw: string;
  try {
    raw = await readFile(resolvedPath, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new ConfigError(
        `Config file not found: ${resolvedPath}`,
      );
    }
    throw new ConfigError(
      `Failed to read config file: ${resolvedPath} — ${(err as Error).message}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ConfigError(
      `Config file is not valid JSON: ${resolvedPath}`,
    );
  }

  const valid = validate(parsed);
  if (!valid) {
    const errors = validate.errors
      ?.map((e: { instancePath?: string; message?: string }) => {
        const field = e.instancePath || "(root)";
        return `  ${field}: ${e.message}`;
      })
      .join("\n");
    throw new ConfigError(
      `Invalid configuration:\n${errors}`,
    );
  }

  return parsed as RuntimeConfig;
}
