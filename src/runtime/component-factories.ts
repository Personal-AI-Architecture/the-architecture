import { createAuthMiddleware } from "../auth/middleware.js";
import { createV1AuthProvider } from "../auth/provider.js";
import { createEngine } from "../engine/index.js";
import { createToolExecutor } from "../engine/tool-executor.js";
import type { ProviderAdapter, ToolExecutor } from "../types/index.js";

export function createEngineClient(
  provider: ProviderAdapter,
  toolExecutor: ToolExecutor,
): ReturnType<typeof createEngine> {
  return createEngine(provider, toolExecutor);
}

export async function createFullToolExecutor(
  builtInExecutor: ToolExecutor,
  toolSources: string[],
): Promise<ToolExecutor> {
  return createToolExecutor(builtInExecutor, toolSources);
}

export function createAuthStack(authToken: string): {
  authProvider: ReturnType<typeof createV1AuthProvider>;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
} {
  const authProvider = createV1AuthProvider(authToken);
  const authMiddleware = createAuthMiddleware(authProvider);
  return { authProvider, authMiddleware };
}
