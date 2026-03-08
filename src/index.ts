/**
 * Personal AI Architecture — the Architecture
 *
 * As-dependency entry point: import { boot } from "personal-ai-architecture"
 */

// --- Config + Boot ---
export { boot, BootError } from "./config/boot.js";
export { loadConfig, ConfigError } from "./config/loader.js";
export type { BootResult } from "./config/boot.js";

// --- Gateway ---
export { createConversationStore } from "./gateway/conversation-store.js";
export { createGateway } from "./gateway/index.js";
export { createGatewayRoutes } from "./gateway/routes.js";
export { createServer, startServer } from "./gateway/server.js";

// --- Agent Loop ---
export { createEngine } from "./engine/index.js";
export { createToolExecutor, discoverExternalTools } from "./engine/tool-executor.js";

// --- Memory ---
export { createMemoryTools } from "./memory/tools.js";
export { createMemoryToolExecutor, memoryToolDefinitions } from "./memory/registry.js";

// --- Adapters ---
export { createOpenAICompatibleAdapter } from "./adapters/openai-compatible.js";
export type { AdapterConfig } from "./adapters/openai-compatible.js";
export { createMockProvider } from "./adapters/mock.js";
export { loadAdapterConfig, resolveApiKey } from "./adapters/loader.js";

// --- Auth ---
export { createV1AuthProvider } from "./auth/provider.js";
export { createAuthMiddleware } from "./auth/middleware.js";

// --- Runtime helpers ---
export { createEngineClient, createAuthStack, createFullToolExecutor } from "./runtime/component-factories.js";

// --- Types ---
export type * from "./types/index.js";
