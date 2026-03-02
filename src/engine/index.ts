import type {
  EngineEvent,
  EngineRequest,
  Message,
  ProviderAdapter,
  ToolExecutor,
  ToolResult,
} from "../types/index.js";

interface EngineOptions {
  maxIterations?: number;
  toolTimeout?: number;
}

type ProviderToolCallEvent = Extract<
  import("../types/index.js").ProviderEvent,
  { type: "tool-call" }
>;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function executeToolCallWithTimeout(
  toolExecutor: ToolExecutor,
  toolCall: ProviderToolCallEvent,
  timeoutMs: number,
): Promise<ToolResult> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const timeoutResult = new Promise<ToolResult>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({
          id: toolCall.id,
          error: "Tool execution timeout",
        });
      }, timeoutMs);
    });

    const executionResult = toolExecutor.execute(toolCall.name, toolCall.arguments);
    const result = await Promise.race([executionResult, timeoutResult]);

    return {
      id: toolCall.id,
      output: result.output,
      error: result.error,
    };
  } catch (error) {
    return {
      id: toolCall.id,
      error: getErrorMessage(error),
    };
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export function createEngine(
  provider: ProviderAdapter,
  toolExecutor: ToolExecutor,
  options?: EngineOptions,
): { chat(request: EngineRequest): AsyncIterable<EngineEvent> } {
  const maxIterations = options?.maxIterations ?? 50;
  const toolTimeout = options?.toolTimeout ?? 30_000;

  return {
    async *chat(request: EngineRequest): AsyncIterable<EngineEvent> {
      const tools = toolExecutor.listTools();
      let messages = request.messages;
      let iterations = 0;

      while (true) {
        const collectedToolCalls: ProviderToolCallEvent[] = [];
        let continueWithTools = false;
        let finished = false;

        try {
          for await (const event of provider.complete(messages, tools)) {
            if (event.type === "text-delta") {
              yield {
                type: "text-delta",
                content: event.content,
              };
              continue;
            }

            if (event.type === "tool-call") {
              collectedToolCalls.push(event);
              continue;
            }

            if (event.type === "error") {
              yield {
                type: "error",
                code: "provider_error",
                message: event.message,
              };
              return;
            }

            finished = true;

            if (event.finish_reason === "tool_calls") {
              for (const toolCall of collectedToolCalls) {
                yield {
                  type: "tool-call",
                  id: toolCall.id,
                  name: toolCall.name,
                  arguments: toolCall.arguments,
                };
              }

              const toolResults = await Promise.all(
                collectedToolCalls.map((toolCall) =>
                  executeToolCallWithTimeout(toolExecutor, toolCall, toolTimeout),
                ),
              );

              for (const result of toolResults) {
                yield {
                  type: "tool-result",
                  id: result.id,
                  output: result.output,
                  error: result.error,
                };
              }

              const assistantMessage: Message = {
                role: "assistant",
                content: "",
                tool_calls: collectedToolCalls.map((toolCall) => ({
                  id: toolCall.id,
                  name: toolCall.name,
                  arguments: toolCall.arguments,
                })),
              };

              const toolMessages: Message[] = toolResults.map((result) => ({
                role: "tool",
                content: result.error ?? result.output ?? "",
                tool_call_id: result.id,
              }));

              messages = [...messages, assistantMessage, ...toolMessages];

              iterations += 1;
              if (iterations >= maxIterations) {
                yield {
                  type: "error",
                  code: "provider_error",
                  message: "Max iterations reached",
                };
                return;
              }

              continueWithTools = true;
              break;
            }

            yield {
              type: "done",
              finish_reason: event.finish_reason,
              usage: event.usage,
            };
            return;
          }
        } catch (error) {
          yield {
            type: "error",
            code: "provider_error",
            message: getErrorMessage(error),
          };
          return;
        }

        if (continueWithTools) {
          continue;
        }

        if (!finished) {
          yield {
            type: "error",
            code: "provider_error",
            message: "Provider stream ended without finish event",
          };
        }
        return;
      }
    },
  };
}
