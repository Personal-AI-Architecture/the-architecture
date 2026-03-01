# Phase 1A: Memory Tools — Codex Task

## What You're Building

The filesystem-backed implementation of Your Memory — the 7 operations that let the system read, write, search, and version its own data. This is the platform everything else runs on.

You are building **two things**:
1. `src/memory/tools.ts` — the 7 memory operations
2. `src/memory/registry.ts` — tool self-description and executor routing

## Interfaces You Must Implement

All types are already defined in `src/types/index.ts`. Do not modify the type definitions — implement against them exactly.

### MemoryTools interface (from `src/types/index.ts`)

```typescript
interface MemoryTools {
  read(params: { path: string }): Promise<FileContent>;
  write(params: { path: string; content: string }): Promise<MemoryResult>;
  edit(params: { path: string; old_content: string; new_content: string }): Promise<MemoryResult>;
  delete(params: { path: string }): Promise<MemoryResult>;
  search(params: { query: string; path?: string; type?: "content" | "filename" }): Promise<SearchMatch[]>;
  list(params: { path: string; recursive?: boolean }): Promise<ListEntry[]>;
  history(params: { path: string; limit?: number }): Promise<HistoryEntry[]>;
}
```

### Return types (from `src/types/index.ts`)

```typescript
interface MemoryResult { success: boolean; data?: unknown; error?: string; }
interface FileContent { path: string; content: string; modified_at: string; }
interface SearchMatch { path: string; line: number; content: string; context?: string; }
interface ListEntry { name: string; path: string; type: "file" | "directory"; modified_at: string; size?: number; }
interface HistoryEntry { hash: string; message: string; author: string; timestamp: string; diff?: string; }
```

### ToolExecutor interface (from `src/types/index.ts`)

```typescript
interface ToolExecutor {
  execute(name: string, arguments_: Record<string, unknown>): Promise<ToolResult>;
  listTools(): ToolDefinition[];
}
```

### ToolResult (from `src/types/index.ts`)

```typescript
interface ToolResult { id: string; output?: string; error?: string; }
```

---

## File 1: `src/memory/tools.ts`

Export a factory function:

```typescript
export function createMemoryTools(memoryRoot: string): MemoryTools
```

### Operation Specifications

**`read(params)`**
- Resolve `params.path` relative to `memoryRoot`
- Read file with `fs.readFile` (utf-8)
- Return `FileContent` with path, content, and `modified_at` (ISO 8601 from `fs.stat`)
- If file doesn't exist, throw an error with a clear message

**`write(params)`**
- Resolve `params.path` relative to `memoryRoot`
- Create intermediate directories with `fs.mkdir({ recursive: true })`
- Write file with `fs.writeFile` (utf-8)
- Return `{ success: true }`
- On failure, return `{ success: false, error: "<message>" }` — do NOT leave partial writes on disk

**`edit(params)`**
- Read current content of file
- Find `old_content` in the file. If not found, return `{ success: false, error: "Content not found in file" }`
- Replace first occurrence of `old_content` with `new_content`
- Write updated content back
- Return `{ success: true }`

**`delete(params)`**
- Resolve `params.path` relative to `memoryRoot`
- Remove file with `fs.unlink`
- Return `{ success: true }`
- If file doesn't exist, return `{ success: false, error: "<message>" }`

**`search(params)`**
- If `type` is `"filename"` (or omitted and query looks like a glob): search filenames matching the query pattern
- If `type` is `"content"` (or default): read files line by line, return matches with line numbers
- `params.path` limits search scope (defaults to root)
- Return `SearchMatch[]` with path, line, content, and optional context (surrounding lines)

**`list(params)`**
- Resolve `params.path` relative to `memoryRoot`
- Read directory with `fs.readdir({ withFileTypes: true })`
- If `recursive`, traverse subdirectories
- Return `ListEntry[]` with name, path (relative to memoryRoot), type, modified_at, size

**`history(params)`**
- Use `simple-git` to run `git log` on the resolved path
- Return `HistoryEntry[]` with hash, message, author, timestamp
- If `limit` provided, limit the number of entries
- If git is not available or `memoryRoot` is not a git repo, throw an error with a clear message (e.g., "Git is not available" or "Not a git repository"). Do NOT crash — other memory operations must still work even if history fails.

### Path Safety (CRITICAL)

Every operation that accepts a `path` parameter MUST:

1. Resolve the path relative to `memoryRoot` using `path.resolve(memoryRoot, userPath)`
2. Verify the resolved path starts with the real path of `memoryRoot` (use `fs.realpath` to resolve symlinks)
3. Reject with a thrown error if the path escapes `memoryRoot`

This means:
- `../../../etc/passwd` → rejected
- `/etc/passwd` (absolute path) → rejected
- `subdir/../../etc/passwd` → rejected
- Symlinks that resolve outside `memoryRoot` → rejected
- `notes/todo.md` → allowed (resolves inside memoryRoot)

Create a shared `resolveSafePath(memoryRoot, userPath)` helper that all operations call.

---

## File 2: `src/memory/registry.ts`

Export:

```typescript
export function createMemoryToolExecutor(memoryTools: MemoryTools): ToolExecutor
export const memoryToolDefinitions: ToolDefinition[]
```

### Tool Definitions

7 tool definitions matching the `ToolDefinition` schema (from `specs/schemas/tool-definition.json`):

| name | source | category |
|------|--------|----------|
| `memory_read` | `native:memory` | `always-send` |
| `memory_write` | `native:memory` | `always-send` |
| `memory_edit` | `native:memory` | `always-send` |
| `memory_delete` | `native:memory` | `always-send` |
| `memory_search` | `native:memory` | `always-send` |
| `memory_list` | `native:memory` | `always-send` |
| `memory_history` | `native:memory` | `always-send` |

Each definition must include:
- `name`: prefixed with `memory_` to namespace
- `description`: clear description of what the tool does
- `parameters`: JSON Schema object describing the tool's input parameters
- `source`: `"native:memory"`
- `category`: `"always-send"`

### Tool Executor

`createMemoryToolExecutor(memoryTools)` returns an object implementing `ToolExecutor`:

- `listTools()` → returns `memoryToolDefinitions`
- `execute(name, arguments_)` → routes to the correct `memoryTools` method:
  - `"memory_read"` → `memoryTools.read(arguments_)`
  - `"memory_write"` → `memoryTools.write(arguments_)`
  - etc.
  - Unknown tool name → return `{ id: name, error: "Unknown tool: <name>" }`
- The `id` field in the returned `ToolResult` should be the tool name
- On success, serialize the result to JSON string in the `output` field
- On error (tool throws), return `{ id: name, error: "<message>" }`

---

## Dependencies

You may use:
- `node:fs/promises` — file operations
- `node:path` — path resolution
- `simple-git` — git operations (already in package.json)
- Types from `../types/index.js`

You must NOT import from:
- `../engine/`
- `../gateway/`
- `../auth/`
- `../adapters/`

---

## Constraints

1. All paths relative to `memoryRoot` — never access files outside it
2. No hardcoded file paths, provider names, or product names
3. No imports from engine, gateway, auth, or adapters
4. Use the exact types from `src/types/index.ts` — do not redefine them
5. Export `createMemoryTools` and `createMemoryToolExecutor` as named exports
6. Use ESM imports (`import from`, not `require`)
7. TypeScript strict mode — no `any`, no implicit types

---

## How to Verify Your Work

```bash
# Build
npm run build

# Check imports
npm run check:imports

# Check lock-in
npm run check:lockin

# Lint
npm run lint
```

All four must pass. Tests will be run separately by the reviewer.
