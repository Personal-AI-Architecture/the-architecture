import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface RawAdapterConfig {
  name: string;
  description: string;
  base_url: string;
  api_key_ref: string;
  format: string;
  default_model: string;
}

function adaptersDir(): string {
  return resolve(import.meta.dirname, "../../adapters");
}

export async function loadAdapterConfig(
  adapterName: string,
): Promise<RawAdapterConfig> {
  const filePath = resolve(adaptersDir(), `${adapterName}.json`);

  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      throw new Error(`Adapter config not found: ${filePath}`);
    }

    throw new Error(
      `Failed to read adapter config: ${filePath} — ${(error as Error).message}`,
    );
  }

  try {
    return JSON.parse(raw) as RawAdapterConfig;
  } catch {
    throw new Error(`Adapter config is not valid JSON: ${filePath}`);
  }
}

export function resolveApiKey(config: RawAdapterConfig): string {
  if (config.api_key_ref === "") {
    return "";
  }

  const value = process.env[config.api_key_ref];
  if (value === undefined) {
    throw new Error(
      `API key not found: set ${config.api_key_ref} environment variable`,
    );
  }

  return value;
}
