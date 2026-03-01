#!/usr/bin/env node

/**
 * Personal AI Architecture — CLI Entry Point
 *
 * Commands:
 *   boot-check  — Verify config loads and memory_root is accessible
 *
 * Usage:
 *   npx personal-ai boot-check
 *   npx personal-ai boot-check --config /path/to/config.json
 */

import { boot } from "./config/boot.js";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case "boot-check": {
      const configIdx = args.indexOf("--config");
      const configPath =
        configIdx !== -1 ? args[configIdx + 1] : undefined;

      try {
        const result = await boot(configPath);
        console.log(
          `Config loaded. Memory root: ${result.config.memory_root}. Status: OK.`,
        );
      } catch (err) {
        console.error((err as Error).message);
        process.exit(1);
      }
      break;
    }

    default:
      console.log("Personal AI Architecture — Level 1 Foundation");
      console.log("");
      console.log("Commands:");
      console.log("  boot-check    Verify config and memory root");
      console.log("");
      console.log("Usage:");
      console.log("  npx personal-ai boot-check");
      console.log(
        "  npx personal-ai boot-check --config /path/to/config.json",
      );
      break;
  }
}

main().catch((err) => {
  console.error("Fatal:", (err as Error).message);
  process.exit(1);
});
