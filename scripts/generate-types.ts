/**
 * Type Generation Script
 *
 * Reads 5 canonical JSON schemas from specs/schemas/ and generates
 * TypeScript types at src/types/generated.ts.
 *
 * Run: npm run generate:types
 */

import { compileFromFile } from "json-schema-to-typescript";
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { resolve, basename } from "node:path";

const SCHEMAS_DIR = resolve(import.meta.dirname, "../specs/schemas");
const OUTPUT_FILE = resolve(import.meta.dirname, "../src/types/generated.ts");

async function main() {
  const files = await readdir(SCHEMAS_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

  if (jsonFiles.length === 0) {
    console.error("No JSON schema files found in", SCHEMAS_DIR);
    process.exit(1);
  }

  const parts: string[] = [
    "/**",
    " * Generated TypeScript types from canonical JSON schemas.",
    " * DO NOT EDIT — regenerate with: npm run generate:types",
    ` * Source: specs/schemas/ (${jsonFiles.length} schemas)`,
    ` * Generated: ${new Date().toISOString()}`,
    " */",
    "",
  ];

  for (const file of jsonFiles) {
    const filePath = resolve(SCHEMAS_DIR, file);
    const schemaName = basename(file, ".json");
    console.log(`  Generating types from ${schemaName}.json`);

    const ts = await compileFromFile(filePath, {
      bannerComment: "",
      additionalProperties: false,
      style: {
        semi: true,
        singleQuote: false,
      },
    });

    parts.push(`// --- ${schemaName} ---`);
    parts.push(ts);
    parts.push("");
  }

  // Ensure output directory exists
  await mkdir(resolve(import.meta.dirname, "../src/types"), { recursive: true });
  await writeFile(OUTPUT_FILE, parts.join("\n"), "utf-8");

  console.log(
    `\nGenerated ${jsonFiles.length} schema types → src/types/generated.ts`,
  );
}

main().catch((err) => {
  console.error("Type generation failed:", err);
  process.exit(1);
});
