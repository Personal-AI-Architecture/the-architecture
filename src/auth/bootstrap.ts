import { randomBytes } from "node:crypto";
import { access, chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function resolveAuthToken(configDir: string): Promise<string> {
  if (process.env.PAI_AUTH_TOKEN !== undefined) {
    return process.env.PAI_AUTH_TOKEN;
  }

  const tokenPath = resolve(configDir, "auth-token");

  if (await exists(tokenPath)) {
    const token = await readFile(tokenPath, "utf-8");
    return token.trim();
  }

  await mkdir(configDir, { recursive: true });

  const token = randomBytes(32).toString("hex");
  await writeFile(tokenPath, `${token}\n`, { encoding: "utf-8", mode: 0o600 });
  await chmod(tokenPath, 0o600);

  console.log(`Auth token written to: ${tokenPath}`);

  return token;
}
