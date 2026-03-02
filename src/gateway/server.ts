import { randomUUID } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { boot } from "../config/boot.js";
import { createMockProvider } from "../adapters/mock.js";
import { createOpenAICompatibleAdapter } from "../adapters/openai-compatible.js";
import type { AdapterConfig } from "../adapters/openai-compatible.js";
import { createMemoryToolExecutor } from "../memory/registry.js";
import { createMemoryTools } from "../memory/tools.js";
import { createAuthStack, createEngineClient, createFullToolExecutor } from "../runtime/component-factories.js";
import { createConversationStore } from "./conversation-store.js";
import { createGateway } from "./index.js";
import { createGatewayRoutes } from "./routes.js";
import { Hono } from "hono";
import { createServer as createHttpServer } from "node:http";
import { join } from "node:path";
import { Readable } from "node:stream";
import type { ProviderAdapter, RuntimeConfig } from "../types/index.js";

function methodHasBody(method: string | undefined): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized !== "GET" && normalized !== "HEAD";
}

function toRequestUrl(req: import("node:http").IncomingMessage, port: number): URL {
  const host = req.headers.host ?? `127.0.0.1:${port}`;
  return new URL(req.url ?? "/", `http://${host}`);
}

async function toFetchRequest(
  req: import("node:http").IncomingMessage,
  port: number,
): Promise<Request> {
  const init: RequestInit & { duplex?: "half" } = {
    method: req.method,
    headers: req.headers as HeadersInit,
  };

  if (methodHasBody(req.method)) {
    init.body = req as unknown as BodyInit;
    init.duplex = "half";
  }

  return new Request(toRequestUrl(req, port), init);
}

function writeFetchResponse(
  response: Response,
  res: import("node:http").ServerResponse,
): void {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (!response.body) {
    res.end();
    return;
  }

  const responseBody = Readable.fromWeb(
    response.body as any,
  );
  responseBody.pipe(res);
}

export async function createServer(options: {
  config: RuntimeConfig;
  authToken: string;
  systemPrompt?: string;
  provider?: ProviderAdapter;
  adapterConfig?: AdapterConfig;
}): Promise<Hono> {
  const memoryTools = createMemoryTools(options.config.memory_root);
  const memoryExecutor = createMemoryToolExecutor(memoryTools);

  // Full tool executor: built-in memory tools + discovered external tools
  const toolExecutor = await createFullToolExecutor(
    memoryExecutor,
    options.config.tool_sources,
  );

  // Provider: explicit > adapter config > mock fallback
  const provider =
    options.provider ??
    (options.adapterConfig
      ? createOpenAICompatibleAdapter(options.adapterConfig)
      : createMockProvider({
          events: [
            { type: "text-delta", content: "Mock response." },
            {
              type: "finish",
              finish_reason: "stop",
            },
          ],
        }));

  const engine = createEngineClient(provider, toolExecutor);
  const conversationStore = createConversationStore(
    join(options.config.memory_root, ".data", "conversations.db"),
  );

  const gateway = createGateway({
    engine,
    conversationStore,
    systemPrompt: options.systemPrompt,
  });

  const gatewayRoutes = createGatewayRoutes({
    gateway,
    conversationStore,
  });

  const { authMiddleware } = createAuthStack(options.authToken);

  const app = new Hono();
  app.use("*", authMiddleware);
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.route("/", gatewayRoutes);

  return app;
}

/**
 * Resolve auth token: env var > existing file > generate + write to file.
 *
 * Per 1B.3: if PAI_AUTH_TOKEN is not set, generate a random token at first
 * boot, write to {memory_root}/.data/auth-token with 0600 permissions,
 * and print the file path to stdout (never the token itself).
 */
async function resolveAuthToken(memoryRoot: string): Promise<string> {
  if (process.env.PAI_AUTH_TOKEN) {
    return process.env.PAI_AUTH_TOKEN;
  }

  const dataDir = join(memoryRoot, ".data");
  const tokenPath = join(dataDir, "auth-token");

  // Try reading existing token file
  try {
    const existing = await readFile(tokenPath, "utf-8");
    const trimmed = existing.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  } catch {
    // File doesn't exist yet — generate below
  }

  // Generate new token and persist
  const token = randomUUID();
  await mkdir(dataDir, { recursive: true });
  await writeFile(tokenPath, token, { mode: 0o600 });
  await chmod(tokenPath, 0o600);
  console.log(`Auth token written to: ${tokenPath}`);

  return token;
}

export async function startServer(options?: {
  port?: number;
  configPath?: string;
}): Promise<void> {
  const port = options?.port ?? 3000;
  const bootResult = await boot(options?.configPath);

  const authToken = await resolveAuthToken(bootResult.config.memory_root);
  const app = await createServer({
    config: bootResult.config,
    authToken,
    adapterConfig: bootResult.adapterConfig ?? undefined,
  });

  const server = createHttpServer(async (req, res) => {
    try {
      const request = await toFetchRequest(req, port);
      const response = await app.fetch(request);
      writeFetchResponse(response, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          code: "internal_error",
          message,
        }),
      );
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });

  console.log(`Gateway server listening on http://127.0.0.1:${port}`);

  // Graceful shutdown
  const shutdown = () => {
    console.log("Shutting down...");
    server.close(() => {
      process.exit(0);
    });
    // Force exit after 5s if connections don't drain
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
