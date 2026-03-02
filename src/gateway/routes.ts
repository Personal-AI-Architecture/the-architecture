import { Hono } from "hono";
import type { ConversationStore, Message } from "../types/index.js";
import {
  ConversationNotFoundError,
  createGateway,
} from "./index.js";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidRole(role: unknown): role is Message["role"] {
  return (
    role === "system" ||
    role === "user" ||
    role === "assistant" ||
    role === "tool"
  );
}

function isValidMessage(value: unknown): value is Message {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isValidRole(value.role) &&
    typeof value.content === "string"
  );
}

async function parseMessageRequest(
  request: Request,
): Promise<
  | {
      message: Message;
      metadata?: Record<string, unknown>;
    }
  | { error: Response }
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      error: new Response(
        JSON.stringify({
          code: "bad_request",
          message: "Malformed JSON body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  if (!isRecord(body) || !isValidMessage(body.message)) {
    return {
      error: new Response(
        JSON.stringify({
          code: "bad_request",
          message: "Invalid message payload",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  if (
    body.metadata !== undefined &&
    !isRecord(body.metadata)
  ) {
    return {
      error: new Response(
        JSON.stringify({
          code: "bad_request",
          message: "metadata must be an object",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }

  return {
    message: body.message,
    metadata: body.metadata,
  };
}

async function streamSse(
  stream: AsyncIterable<
    import("../types/index.js").EngineEvent & { conversation_id?: string }
  >,
): Promise<Response> {
  let body = "";

  const writeEvent = (event: unknown) => {
    body += `event: ${(event as { type: string }).type}\ndata: ${JSON.stringify(event)}\n\n`;
  };

  try {
    for await (const event of stream) {
      writeEvent(event);
    }
  } catch (error) {
    writeEvent({
      type: "error",
      code: "provider_error",
      message: getErrorMessage(error),
    });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function notFoundResponse(message: string): Response {
  return new Response(
    JSON.stringify({
      code: "not_found",
      message,
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export function createGatewayRoutes(deps: {
  gateway: ReturnType<typeof createGateway>;
  conversationStore: ConversationStore;
}): Hono {
  const app = new Hono();

  app.post("/conversations/messages", async (c) => {
    const parsed = await parseMessageRequest(c.req.raw);
    if ("error" in parsed) {
      return parsed.error;
    }

    return await streamSse(
      deps.gateway.sendMessage({
        message: parsed.message,
        metadata: parsed.metadata,
      }),
    );
  });

  app.post("/conversations/:id/messages", async (c) => {
    const conversationId = c.req.param("id");
    const existing = await deps.conversationStore.get(conversationId);
    if (!existing) {
      return c.json(
        {
          code: "not_found",
          message: `Conversation not found: ${conversationId}`,
        },
        404,
      );
    }

    const parsed = await parseMessageRequest(c.req.raw);
    if ("error" in parsed) {
      return parsed.error;
    }

    try {
      return await streamSse(
        deps.gateway.sendMessage({
          conversation_id: conversationId,
          message: parsed.message,
          metadata: parsed.metadata,
        }),
      );
    } catch (error) {
      if (error instanceof ConversationNotFoundError) {
        return notFoundResponse(error.message);
      }
      throw error;
    }
  });

  app.get("/conversations", async (c) => {
    const conversations = await deps.conversationStore.list();
    return c.json(conversations);
  });

  app.get("/conversations/:id", async (c) => {
    const conversationId = c.req.param("id");
    const conversation = await deps.conversationStore.get(conversationId);
    if (!conversation) {
      return c.json(
        {
          code: "not_found",
          message: `Conversation not found: ${conversationId}`,
        },
        404,
      );
    }
    return c.json(conversation);
  });

  return app;
}
