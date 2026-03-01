/**
 * Personal AI Architecture — Level 1 Foundation
 *
 * As-dependency entry point: import { boot } from "personal-ai-architecture"
 */

export { boot, BootError } from "./config/boot.js";
export { loadConfig, ConfigError } from "./config/loader.js";
export type { BootResult } from "./config/boot.js";

// Re-export all types for consumers
export type * from "./types/index.js";
