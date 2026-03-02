/**
 * Personal AI Architecture — Level 1 Foundation
 *
 * As-dependency entry point: import { boot } from "personal-ai-architecture"
 */

export { boot, BootError } from "./config/boot.js";
export { loadConfig, ConfigError } from "./config/loader.js";
export { createConversationStore } from "./gateway/conversation-store.js";
export { createGateway } from "./gateway/index.js";
export { createGatewayRoutes } from "./gateway/routes.js";
export { createServer, startServer } from "./gateway/server.js";
export type { BootResult } from "./config/boot.js";

// Re-export all types for consumers
export type * from "./types/index.js";
