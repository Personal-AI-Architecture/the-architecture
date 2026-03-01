import type {
  Message,
  ProviderAdapter,
  ProviderEvent,
  ToolDefinition,
} from "../types/index.js";

export interface MockScenario {
  events: ProviderEvent[];
}

export function createMockProvider(scenario: MockScenario): ProviderAdapter {
  return {
    async *complete(
      _messages: Message[],
      _tools: ToolDefinition[],
    ): AsyncIterable<ProviderEvent> {
      for (const event of scenario.events) {
        yield event;
      }
    },
  };
}
