import type {
  Message,
  ProviderAdapter,
  ProviderEvent,
  ToolDefinition,
} from "../types/index.js";

export interface AdapterConfig {
  name: string;
  base_url: string;
  api_key: string;
  default_model: string;
}

interface OpenAIToolCallDelta {
  index: number;
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

interface OpenAIChunk {
  choices?: Array<{
    delta?: {
      content?: string;
      tool_calls?: OpenAIToolCallDelta[];
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

interface BufferedToolCall {
  id?: string;
  name?: string;
  argumentsText: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function toFinishReason(
  finishReason: unknown,
): "stop" | "tool_calls" | "max_tokens" {
  if (finishReason === "tool_calls" || finishReason === "max_tokens") {
    return finishReason;
  }
  return "stop";
}

function toProviderError(status: number): ProviderEvent {
  switch (status) {
    case 401:
      return {
        type: "error",
        code: "auth_error",
        message: "Invalid API key",
      };
    case 429:
      return {
        type: "error",
        code: "rate_limit",
        message: "Rate limited by provider",
      };
    case 502:
    case 503:
    case 504:
      return {
        type: "error",
        code: "provider_unavailable",
        message: "Provider is unavailable",
      };
    default:
      return {
        type: "error",
        code: "provider_error",
        message: `Provider request failed with status ${status}`,
      };
  }
}

function toOpenAIMessages(messages: Message[]): unknown[] {
  return messages.map((message) => {
    const payload: {
      role: Message["role"];
      content: string;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
          name: string;
          arguments: string;
        };
      }>;
      tool_call_id?: string;
    } = {
      role: message.role,
      content: message.content,
    };

    if (message.tool_calls && message.tool_calls.length > 0) {
      payload.tool_calls = message.tool_calls.map((toolCall) => ({
        id: toolCall.id,
        type: "function",
        function: {
          name: toolCall.name,
          arguments: JSON.stringify(toolCall.arguments),
        },
      }));
    }

    if (message.tool_call_id) {
      payload.tool_call_id = message.tool_call_id;
    }

    return payload;
  });
}

function toOpenAITools(tools: ToolDefinition[]): unknown[] {
  return tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function flushToolCall(
  toolCallBuffers: Map<number, BufferedToolCall>,
  index: number,
): ProviderEvent | null {
  const buffered = toolCallBuffers.get(index);
  if (!buffered) {
    return null;
  }
  toolCallBuffers.delete(index);

  if (!buffered.id || !buffered.name) {
    return {
      type: "error",
      code: "parse_error",
      message: "Malformed response from provider",
    };
  }

  try {
    const parsedArguments = buffered.argumentsText
      ? (JSON.parse(buffered.argumentsText) as Record<string, unknown>)
      : {};

    return {
      type: "tool-call",
      id: buffered.id,
      name: buffered.name,
      arguments: parsedArguments,
    };
  } catch {
    return {
      type: "error",
      code: "parse_error",
      message: "Malformed response from provider",
    };
  }
}

function flushAllToolCalls(
  toolCallBuffers: Map<number, BufferedToolCall>,
): ProviderEvent[] {
  const events: ProviderEvent[] = [];
  const indices = [...toolCallBuffers.keys()].sort((a, b) => a - b);
  for (const index of indices) {
    const event = flushToolCall(toolCallBuffers, index);
    if (event) {
      events.push(event);
    }
  }
  return events;
}

export function createOpenAICompatibleAdapter(
  config: AdapterConfig,
): ProviderAdapter {
  return {
    async *complete(
      messages: Message[],
      tools: ToolDefinition[],
    ): AsyncIterable<ProviderEvent> {
      const requestBody: {
        model: string;
        messages: unknown[];
        stream: boolean;
        tools?: unknown[];
      } = {
        model: config.default_model,
        messages: toOpenAIMessages(messages),
        stream: true,
      };

      if (tools.length > 0) {
        requestBody.tools = toOpenAITools(tools);
      }

      const endpoint = `${normalizeBaseUrl(config.base_url)}/chat/completions`;

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.api_key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
      } catch (error) {
        yield {
          type: "error",
          code: "network_error",
          message: getErrorMessage(error),
        };
        return;
      }

      if (!response.ok) {
        yield toProviderError(response.status);
        return;
      }

      if (!response.body) {
        yield {
          type: "error",
          code: "parse_error",
          message: "Malformed response from provider",
        };
        return;
      }

      const decoder = new TextDecoder();
      const toolCallBuffers = new Map<number, BufferedToolCall>();
      let buffer = "";
      let emittedFinish = false;

      const handleSseBlock = (rawBlock: string): ProviderEvent[] => {
        const events: ProviderEvent[] = [];
        const dataLines = rawBlock
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart());

        if (dataLines.length === 0) {
          return events;
        }

        const data = dataLines.join("\n").trim();
        if (data.length === 0) {
          return events;
        }

        if (data === "[DONE]") {
          events.push(...flushAllToolCalls(toolCallBuffers));
          if (!emittedFinish) {
            events.push({ type: "finish", finish_reason: "stop" });
            emittedFinish = true;
          }
          return events;
        }

        let parsed: OpenAIChunk;
        try {
          parsed = JSON.parse(data) as OpenAIChunk;
        } catch {
          events.push({
            type: "error",
            code: "parse_error",
            message: "Malformed response from provider",
          });
          return events;
        }

        const choice = parsed.choices?.[0];
        if (!choice) {
          return events;
        }

        const delta = choice.delta;
        if (typeof delta?.content === "string" && delta.content.length > 0) {
          events.push({ type: "text-delta", content: delta.content });
        }

        if (delta?.tool_calls && delta.tool_calls.length > 0) {
          for (const toolCallDelta of delta.tool_calls) {
            if (typeof toolCallDelta.index !== "number") {
              continue;
            }

            const earlierIndices = [...toolCallBuffers.keys()]
              .filter((existingIndex) => existingIndex < toolCallDelta.index)
              .sort((a, b) => a - b);
            for (const earlierIndex of earlierIndices) {
              const earlierEvent = flushToolCall(toolCallBuffers, earlierIndex);
              if (earlierEvent) {
                events.push(earlierEvent);
              }
            }

            const current = toolCallBuffers.get(toolCallDelta.index) ?? {
              argumentsText: "",
            };

            if (toolCallDelta.id) {
              current.id = toolCallDelta.id;
            }
            if (toolCallDelta.function?.name) {
              current.name = toolCallDelta.function.name;
            }
            if (typeof toolCallDelta.function?.arguments === "string") {
              current.argumentsText += toolCallDelta.function.arguments;
            }

            toolCallBuffers.set(toolCallDelta.index, current);
          }
        }

        if (choice.finish_reason) {
          events.push(...flushAllToolCalls(toolCallBuffers));

          const usage =
            typeof parsed.usage?.prompt_tokens === "number" &&
            typeof parsed.usage?.completion_tokens === "number"
              ? {
                  prompt_tokens: parsed.usage.prompt_tokens,
                  completion_tokens: parsed.usage.completion_tokens,
                }
              : undefined;

          events.push({
            type: "finish",
            finish_reason: toFinishReason(choice.finish_reason),
            usage,
          });
          emittedFinish = true;
        }

        return events;
      };

      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const events = handleSseBlock(block);
          for (const event of events) {
            yield event;
          }
        }
      }

      buffer += decoder.decode();
      if (buffer.trim().length > 0) {
        const events = handleSseBlock(buffer);
        for (const event of events) {
          yield event;
        }
      }

      if (!emittedFinish) {
        for (const event of flushAllToolCalls(toolCallBuffers)) {
          yield event;
        }
        yield { type: "finish", finish_reason: "stop" };
      }
    },
  };
}
