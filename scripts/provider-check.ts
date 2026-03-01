/**
 * Owner Verification: "Can I connect to a model?"
 *
 * Usage:
 *   OPENROUTER_API_KEY=sk-... npx tsx scripts/provider-check.ts
 *
 * Sends a short prompt to your configured provider and streams the response.
 */

import { loadAdapterConfig, resolveApiKey } from "../src/adapters/loader.js";
import { createOpenAICompatibleAdapter } from "../src/adapters/openai-compatible.js";

const adapterName = process.argv[2] ?? "openrouter";

console.log(`Provider check (${adapterName}):\n`);

// Load config
let config;
try {
  config = await loadAdapterConfig(adapterName);
} catch (err) {
  console.log(`  FAIL  Could not load adapter config: ${(err as Error).message}`);
  process.exit(1);
}
console.log(`  Adapter: ${config.name}`);
console.log(`  Model:   ${config.default_model}`);
console.log(`  URL:     ${config.base_url}`);

// Resolve API key
let apiKey: string;
try {
  apiKey = resolveApiKey(config);
} catch (err) {
  console.log(`\n  FAIL  ${(err as Error).message}`);
  process.exit(1);
}
console.log(`  API key: ${"*".repeat(8)}...${apiKey.slice(-4)}`);

// Create adapter and send a test message
const adapter = createOpenAICompatibleAdapter({
  name: config.name,
  base_url: config.base_url,
  api_key: apiKey,
  default_model: config.default_model,
});

console.log("\n  Sending: \"Say hello in exactly 5 words.\"\n");

let gotText = false;
let gotFinish = false;
let gotError = false;
let fullText = "";

for await (const event of adapter.complete(
  [{ role: "user", content: "Say hello in exactly 5 words." }],
  [],
)) {
  if (event.type === "text-delta") {
    gotText = true;
    fullText += (event as { type: "text-delta"; content: string }).content;
  } else if (event.type === "finish") {
    gotFinish = true;
  } else if (event.type === "error") {
    gotError = true;
    const err = event as { type: "error"; code: string; message: string };
    console.log(`  ERROR  [${err.code}] ${err.message}`);
  }
}

if (gotText) {
  console.log(`  Response: "${fullText.trim()}"`);
}

console.log("");

if (gotError) {
  console.log("  FAIL  Provider returned an error.");
  process.exit(1);
} else if (gotText && gotFinish) {
  console.log("  PASS  Streamed response received from provider.");
} else {
  console.log("  FAIL  No text received from provider.");
  process.exit(1);
}
