import { createAuthMiddleware } from "../auth/middleware.js";
import { createV1AuthProvider } from "../auth/provider.js";
import { createEngine } from "../engine/index.js";
import type { ProviderAdapter, ToolExecutor } from "../types/index.js";

export function createEngineClient(
  provider: ProviderAdapter,
  toolExecutor: ToolExecutor,
): ReturnType<typeof createEngine> {
  return createEngine(provider, toolExecutor);
}

export function createAuthStack(authToken: string): {
  authProvider: ReturnType<typeof createV1AuthProvider>;
  authMiddleware: ReturnType<typeof createAuthMiddleware>;
} {
  const authProvider = createV1AuthProvider(authToken);
  const authMiddleware = createAuthMiddleware(authProvider);
  return { authProvider, authMiddleware };
}
