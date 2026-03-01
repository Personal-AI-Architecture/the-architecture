/**
 * Lock-In Check
 *
 * Greps source code for hardcoded values that indicate lock-in:
 * - Hardcoded provider URLs (api.openai.com, api.anthropic.com, etc.)
 * - Hardcoded model names (gpt-4, claude, llama, etc.)
 * - Product-specific names (BrainDrive, braindrive)
 * - Hardcoded file paths (/home/, /Users/, C:\)
 *
 * Run: npm run check:lockin
 */

import { readdir, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";

const SRC_DIR = resolve(import.meta.dirname, "../src");

interface Violation {
  file: string;
  line: number;
  pattern: string;
  content: string;
}

const PATTERNS: Array<{ regex: RegExp; description: string }> = [
  // Provider URLs
  {
    regex: /api\.openai\.com|api\.anthropic\.com|api\.openrouter\.ai/i,
    description: "Hardcoded provider URL",
  },
  // Model names
  {
    regex:
      /\b(gpt-4|gpt-3\.5|claude-3|claude-opus|claude-sonnet|llama-3|gemini)\b/i,
    description: "Hardcoded model name",
  },
  // Product names in source (not in comments or strings that reference specs)
  {
    regex: /\bBrainDrive\b/,
    description: "Product-specific name (BrainDrive)",
  },
  // Hardcoded absolute paths
  {
    regex: /["'`]\/(?:home|Users|opt|var|tmp)\//,
    description: "Hardcoded absolute path",
  },
  // Hardcoded Windows paths
  {
    regex: /["'`][A-Z]:\\/,
    description: "Hardcoded Windows path",
  },
];

async function getFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, {
      withFileTypes: true,
      recursive: true,
    });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".ts")) {
        const fullPath = resolve(entry.parentPath ?? entry.path, entry.name);
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
  return files;
}

async function main() {
  const files = await getFiles(SRC_DIR);
  const allViolations: Violation[] = [];

  for (const file of files) {
    const content = await readFile(file, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

      for (const pattern of PATTERNS) {
        if (pattern.regex.test(line)) {
          allViolations.push({
            file: relative(SRC_DIR, file),
            line: i + 1,
            pattern: pattern.description,
            content: trimmed,
          });
        }
      }
    }
  }

  if (allViolations.length === 0) {
    console.log("Lock-in check: PASS (zero violations)");
    process.exit(0);
  }

  console.error(
    `Lock-in check: FAIL (${allViolations.length} violations)`,
  );
  for (const v of allViolations) {
    console.error(`  ${v.file}:${v.line} — ${v.pattern}`);
    console.error(`    ${v.content}`);
  }
  process.exit(1);
}

main();
