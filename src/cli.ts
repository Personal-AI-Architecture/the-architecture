#!/usr/bin/env node

/**
 * Personal AI Architecture — CLI Entry Point
 *
 * Commands:
 *   start       — Start the local Gateway server (default command)
 *   boot-check  — Verify config loads and memory_root is accessible
 *
 * Usage:
 *   npx personal-ai
 *   npx personal-ai start --port 3000 --config /path/to/config.json
 *   npx personal-ai boot-check
 *   npx personal-ai boot-check --config /path/to/config.json
 */

import { boot } from "./config/boot.js";
import { startServer } from "./gateway/server.js";

const args = process.argv.slice(2);
const command = args[0];

function readOption(optionName: string): string | undefined {
  const optionIndex = args.indexOf(optionName);
  if (optionIndex === -1) {
    return undefined;
  }
  return args[optionIndex + 1];
}

function parsePort(rawPort: string | undefined): number | undefined {
  if (rawPort === undefined) {
    return undefined;
  }

  const parsedPort = Number.parseInt(rawPort, 10);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
    throw new Error(`Invalid --port value: ${rawPort}`);
  }

  return parsedPort;
}

async function main() {
  switch (command) {
    case undefined:
    case "start": {
      const configPath = readOption("--config");
      const port = parsePort(readOption("--port"));
      await startServer({ configPath, port });
      break;
    }

    case "boot-check": {
      const configPath = readOption("--config");

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

    case "help":
    case "--help":
    case "-h":
    default:
      console.log("Personal AI Architecture — the Architecture");
      console.log("");
      console.log("Commands:");
      console.log("  start         Start local server (default)");
      console.log("  boot-check    Verify config and memory root");
      console.log("");
      console.log("Usage:");
      console.log("  npx personal-ai");
      console.log(
        "  npx personal-ai start --port 3000 --config /path/to/config.json",
      );
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
