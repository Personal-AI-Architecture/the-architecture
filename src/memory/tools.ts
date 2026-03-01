import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { simpleGit } from "simple-git";
import type {
  FileContent,
  HistoryEntry,
  ListEntry,
  MemoryResult,
  MemoryTools,
  SearchMatch,
} from "../types/index.js";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
}

function isPathInside(rootPath: string, targetPath: string): boolean {
  return targetPath === rootPath || targetPath.startsWith(`${rootPath}${sep}`);
}

function toRelativePath(rootPath: string, targetPath: string): string {
  const relPath = relative(rootPath, targetPath);
  if (relPath === "") {
    return ".";
  }
  return relPath.split(sep).join("/");
}

async function findNearestExistingPath(targetPath: string): Promise<string> {
  let currentPath = targetPath;

  while (true) {
    try {
      await lstat(currentPath);
      return currentPath;
    } catch (error) {
      const code = getErrorCode(error);
      if (code !== "ENOENT" && code !== "ENOTDIR") {
        throw error;
      }

      const parentPath = dirname(currentPath);
      if (parentPath === currentPath) {
        throw new Error(`Unable to resolve path: ${targetPath}`);
      }
      currentPath = parentPath;
    }
  }
}

async function resolveSafePath(memoryRoot: string, userPath: string): Promise<string> {
  const rootRealPath = await realpath(memoryRoot);
  const candidatePath = resolve(rootRealPath, userPath);

  if (!isPathInside(rootRealPath, candidatePath)) {
    throw new Error(`Path escapes memory root: ${userPath}`);
  }

  const nearestExistingPath = await findNearestExistingPath(candidatePath);
  const nearestExistingRealPath = await realpath(nearestExistingPath);

  if (!isPathInside(rootRealPath, nearestExistingRealPath)) {
    throw new Error(`Path escapes memory root: ${userPath}`);
  }

  if (nearestExistingPath === candidatePath) {
    return nearestExistingRealPath;
  }

  const suffixPath = relative(nearestExistingPath, candidatePath);
  return resolve(nearestExistingRealPath, suffixPath);
}

function queryLooksLikeGlob(query: string): boolean {
  return /[*?[\]{}]/.test(query);
}

function createGlobRegExp(pattern: string): RegExp {
  const escapedPattern = pattern.replace(/[.+^${}()|\\]/g, "\\$&");
  const regexPattern = `^${escapedPattern.replace(/\*/g, ".*").replace(/\?/g, ".")}$`;
  return new RegExp(regexPattern, "i");
}

function createTempPath(targetPath: string): string {
  const uniqueToken = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${targetPath}.tmp-${uniqueToken}`;
}

async function writeFileAtomic(targetPath: string, content: string): Promise<void> {
  await mkdir(dirname(targetPath), { recursive: true });
  const tempPath = createTempPath(targetPath);

  try {
    await writeFile(tempPath, content, "utf-8");
    await rename(tempPath, targetPath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup errors.
    }
    throw error;
  }
}

async function collectTreeEntries(startPath: string): Promise<Array<{ path: string; isDirectory: boolean }>> {
  const startStats = await lstat(startPath);
  if (startStats.isSymbolicLink()) {
    return [];
  }

  if (startStats.isFile()) {
    return [{ path: startPath, isDirectory: false }];
  }

  if (!startStats.isDirectory()) {
    return [];
  }

  const entries: Array<{ path: string; isDirectory: boolean }> = [];
  const pendingDirectories: string[] = [startPath];

  while (pendingDirectories.length > 0) {
    const currentDirectory = pendingDirectories.pop();
    if (!currentDirectory) {
      continue;
    }

    const directoryEntries = await readdir(currentDirectory, { withFileTypes: true });
    for (const directoryEntry of directoryEntries) {
      const entryPath = resolve(currentDirectory, directoryEntry.name);

      if (directoryEntry.isSymbolicLink()) {
        continue;
      }

      if (directoryEntry.isDirectory()) {
        entries.push({ path: entryPath, isDirectory: true });
        pendingDirectories.push(entryPath);
        continue;
      }

      if (directoryEntry.isFile()) {
        entries.push({ path: entryPath, isDirectory: false });
      }
    }
  }

  return entries;
}

function getContext(lines: string[], lineIndex: number): string | undefined {
  const start = Math.max(0, lineIndex - 1);
  const end = Math.min(lines.length, lineIndex + 2);
  const context = lines.slice(start, end).join("\n");

  if (context === lines[lineIndex]) {
    return undefined;
  }
  return context;
}

function normalizeGitError(error: unknown): string {
  const message = getErrorMessage(error);
  if (/not a git repository/i.test(message)) {
    return "Not a git repository";
  }
  if (/ENOENT|spawn git|not found/i.test(message)) {
    return "Git is not available";
  }
  return message;
}

export function createMemoryTools(memoryRoot: string): MemoryTools {
  return {
    async read(params): Promise<FileContent> {
      const safePath = await resolveSafePath(memoryRoot, params.path);
      const rootRealPath = await realpath(memoryRoot);

      try {
        const [content, fileStats] = await Promise.all([
          readFile(safePath, "utf-8"),
          stat(safePath),
        ]);

        return {
          path: toRelativePath(rootRealPath, safePath),
          content,
          modified_at: fileStats.mtime.toISOString(),
        };
      } catch (error) {
        if (getErrorCode(error) === "ENOENT") {
          throw new Error(`File does not exist: ${params.path}`);
        }
        throw error;
      }
    },

    async write(params): Promise<MemoryResult> {
      const safePath = await resolveSafePath(memoryRoot, params.path);

      try {
        await writeFileAtomic(safePath, params.content);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: getErrorMessage(error),
        };
      }
    },

    async edit(params): Promise<MemoryResult> {
      const safePath = await resolveSafePath(memoryRoot, params.path);

      try {
        const currentContent = await readFile(safePath, "utf-8");

        if (!currentContent.includes(params.old_content)) {
          return {
            success: false,
            error: "Content not found in file",
          };
        }

        const updatedContent = currentContent.replace(
          params.old_content,
          params.new_content,
        );

        await writeFileAtomic(safePath, updatedContent);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: getErrorMessage(error),
        };
      }
    },

    async delete(params): Promise<MemoryResult> {
      const safePath = await resolveSafePath(memoryRoot, params.path);

      try {
        await unlink(safePath);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: getErrorMessage(error),
        };
      }
    },

    async search(params): Promise<SearchMatch[]> {
      const scopePath = await resolveSafePath(memoryRoot, params.path ?? ".");
      const rootRealPath = await realpath(memoryRoot);
      const useFilenameSearch =
        params.type === "filename" ||
        (params.type === undefined && queryLooksLikeGlob(params.query));

      const treeEntries = await collectTreeEntries(scopePath);
      if (useFilenameSearch) {
        const isGlob = queryLooksLikeGlob(params.query);
        const globRegex = isGlob ? createGlobRegExp(params.query) : undefined;
        const queryLower = params.query.toLowerCase();

        const filenameMatches: SearchMatch[] = treeEntries
          .filter(({ path: entryPath }) => {
            const entryName = basename(entryPath);
            const entryRelativePath = toRelativePath(rootRealPath, entryPath);

            if (globRegex) {
              return globRegex.test(entryName) || globRegex.test(entryRelativePath);
            }

            return (
              entryName.toLowerCase().includes(queryLower) ||
              entryRelativePath.toLowerCase().includes(queryLower)
            );
          })
          .map(({ path: entryPath }) => ({
            path: toRelativePath(rootRealPath, entryPath),
            line: 0,
            content: basename(entryPath),
          }));

        filenameMatches.sort((a, b) => a.path.localeCompare(b.path));
        return filenameMatches;
      }

      const filePaths = treeEntries
        .filter((entry) => !entry.isDirectory)
        .map((entry) => entry.path);
      const scopeStats = await lstat(scopePath);

      if (scopeStats.isFile() && !filePaths.includes(scopePath)) {
        filePaths.push(scopePath);
      }

      const contentMatches: SearchMatch[] = [];
      for (const filePath of filePaths) {
        let fileContent: string;
        try {
          fileContent = await readFile(filePath, "utf-8");
        } catch {
          continue;
        }

        const lines = fileContent.split(/\r?\n/);
        for (let index = 0; index < lines.length; index++) {
          const line = lines[index];
          if (!line.includes(params.query)) {
            continue;
          }

          contentMatches.push({
            path: toRelativePath(rootRealPath, filePath),
            line: index + 1,
            content: line,
            context: getContext(lines, index),
          });
        }
      }

      contentMatches.sort((a, b) => {
        if (a.path === b.path) {
          return a.line - b.line;
        }
        return a.path.localeCompare(b.path);
      });
      return contentMatches;
    },

    async list(params): Promise<ListEntry[]> {
      const basePath = await resolveSafePath(memoryRoot, params.path);
      const rootRealPath = await realpath(memoryRoot);
      const baseStats = await lstat(basePath);

      if (!baseStats.isDirectory()) {
        throw new Error(`Not a directory: ${params.path}`);
      }

      const entries: ListEntry[] = [];
      const pendingDirectories: string[] = [basePath];

      while (pendingDirectories.length > 0) {
        const currentDirectory = pendingDirectories.pop();
        if (!currentDirectory) {
          continue;
        }

        const directoryEntries = await readdir(currentDirectory, { withFileTypes: true });
        for (const directoryEntry of directoryEntries) {
          if (directoryEntry.isSymbolicLink()) {
            continue;
          }

          const entryPath = resolve(currentDirectory, directoryEntry.name);
          const entryStats = await stat(entryPath);
          const isDirectory = entryStats.isDirectory();

          entries.push({
            name: directoryEntry.name,
            path: toRelativePath(rootRealPath, entryPath),
            type: isDirectory ? "directory" : "file",
            modified_at: entryStats.mtime.toISOString(),
            size: entryStats.isFile() ? entryStats.size : undefined,
          });

          if (params.recursive && isDirectory) {
            pendingDirectories.push(entryPath);
          }
        }
      }

      entries.sort((a, b) => a.path.localeCompare(b.path));
      return entries;
    },

    async history(params): Promise<HistoryEntry[]> {
      const safePath = await resolveSafePath(memoryRoot, params.path);
      const rootRealPath = await realpath(memoryRoot);
      const relativePath = toRelativePath(rootRealPath, safePath);

      const git = simpleGit({ baseDir: rootRealPath });

      try {
        await git.raw(["--version"]);
      } catch {
        throw new Error("Git is not available");
      }

      let isRepo = false;
      try {
        isRepo = await git.checkIsRepo();
      } catch (error) {
        throw new Error(normalizeGitError(error));
      }

      if (!isRepo) {
        throw new Error("Not a git repository");
      }

      const limit =
        typeof params.limit === "number" && params.limit > 0
          ? Math.floor(params.limit)
          : undefined;

      const format = "%H%x1f%s%x1f%an%x1f%aI";
      const args: string[] = ["log", `--pretty=format:${format}`];
      if (limit !== undefined) {
        args.push("-n", String(limit));
      }
      args.push("--", relativePath);

      let rawLog = "";
      try {
        rawLog = await git.raw(args);
      } catch (error) {
        throw new Error(normalizeGitError(error));
      }

      const trimmedLog = rawLog.trim();
      if (trimmedLog === "") {
        return [];
      }

      return trimmedLog.split("\n").map((line) => {
        const [hash = "", message = "", author = "", timestamp = ""] = line.split("\u001f");
        return {
          hash,
          message,
          author,
          timestamp,
        };
      });
    },
  };
}
