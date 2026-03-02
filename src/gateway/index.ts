import { randomUUID } from "node:crypto";
import type {
  Conversation,
  ConversationStore,
  EngineEvent,
  EngineRequest,
  Message,
} from "../types/index.js";

export class ConversationNotFoundError extends Error {
  conversationId: string;

  constructor(conversationId: string) {
    super(`Conversation not found: ${conversationId}`);
    this.name = "ConversationNotFoundError";
    this.conversationId = conversationId;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function buildEngineMessages(
  history: Message[],
  nextMessage: Message,
  systemPrompt?: string,
): Message[] {
  if (systemPrompt) {
    return [
      { role: "system", content: systemPrompt },
      ...history,
      nextMessage,
    ];
  }

  return [...history, nextMessage];
}

async function resolveConversation(
  conversationStore: ConversationStore,
  conversationId?: string,
): Promise<Conversation> {
  if (!conversationId) {
    return conversationStore.create();
  }

  const existing = await conversationStore.get(conversationId);
  if (!existing) {
    throw new ConversationNotFoundError(conversationId);
  }
  return existing;
}

export function createGateway(deps: {
  engine: { chat(request: EngineRequest): AsyncIterable<EngineEvent> };
  conversationStore: ConversationStore;
  systemPrompt?: string;
}): {
  sendMessage(request: {
    conversation_id?: string;
    message: Message;
    metadata?: Record<string, unknown>;
  }): AsyncIterable<EngineEvent & { conversation_id?: string }>;
} {
  const { engine, conversationStore, systemPrompt } = deps;

  return {
    async *sendMessage(request): AsyncIterable<
      EngineEvent & { conversation_id?: string }
    > {
      const conversation = await resolveConversation(
        conversationStore,
        request.conversation_id,
      );
      const conversationId = conversation.id;
      const history = [...conversation.messages];

      await conversationStore.appendMessage(conversationId, request.message);

      const messages = buildEngineMessages(history, request.message, systemPrompt);
      const metadata = {
        conversation_id: conversationId,
        correlation_id: randomUUID(),
        ...(request.metadata ?? {}),
      } as EngineRequest["metadata"];

      const engineRequest: EngineRequest = { messages, metadata };

      let assistantText = "";
      let finished = false;
      let persistedAssistant = false;

      try {
        for await (const event of engine.chat(engineRequest)) {
          if (event.type === "text-delta") {
            assistantText += event.content;
            yield event;
            continue;
          }

          if (event.type === "done") {
            finished = true;
            await conversationStore.appendMessage(conversationId, {
              role: "assistant",
              content: assistantText,
            });
            persistedAssistant = true;
            yield {
              ...event,
              conversation_id: conversationId,
            };
            break;
          }

          if (event.type === "error") {
            finished = true;
            await conversationStore.appendMessage(conversationId, {
              role: "assistant",
              content: assistantText,
            });
            persistedAssistant = true;
            yield event;
            break;
          }

          yield event;
        }
      } catch (error) {
        finished = true;
        await conversationStore.appendMessage(conversationId, {
          role: "assistant",
          content: assistantText,
        });
        persistedAssistant = true;
        yield {
          type: "error",
          code: "provider_error",
          message: getErrorMessage(error),
        };
      }

      if (finished && !persistedAssistant) {
        await conversationStore.appendMessage(conversationId, {
          role: "assistant",
          content: assistantText,
        });
      }
    },
  };
}
