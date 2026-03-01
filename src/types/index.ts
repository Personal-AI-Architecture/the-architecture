/**
 * Type definitions for the Personal AI Architecture.
 *
 * Generated types come from canonical JSON schemas (specs/schemas/).
 * Manual types come from OpenAPI contracts and component interfaces.
 *
 * Re-exported here as the single import point for all types.
 */

// Generated types from JSON schemas (npm run generate:types)
export type {
  RuntimeConfiguration as RuntimeConfig,
  Message,
  ToolDefinition,
  ActorIdentity as Identity,
  PermissionPolicy as Policy,
} from "./generated.js";

// --- Manual types from OpenAPI contracts and component stubs ---

/** Metadata passed through from the Gateway to the Engine */
export interface RequestMetadata {
  conversation_id?: string;
  correlation_id: string;
  trigger?: "message" | "webhook" | "schedule";
  client_context?: Record<string, unknown>;
}

/** The request the Engine receives from the Gateway */
export interface EngineRequest {
  messages: import("./generated.js").Message[];
  metadata?: RequestMetadata;
}

/** SSE events streamed from Engine to Gateway */
export type EngineEvent =
  | { type: "text-delta"; content: string }
  | {
      type: "tool-call";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | { type: "tool-result"; id: string; output?: string; error?: string }
  | {
      type: "done";
      finish_reason: string;
      usage?: { prompt_tokens: number; completion_tokens: number };
    }
  | {
      type: "error";
      code: "provider_error" | "tool_error" | "context_overflow";
      message: string;
    };

/** Events from the provider adapter (model responses) */
export type ProviderEvent =
  | { type: "text-delta"; content: string }
  | {
      type: "tool-call";
      id: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: "finish";
      finish_reason: "stop" | "tool_calls" | "max_tokens";
      usage?: { prompt_tokens: number; completion_tokens: number };
    }
  | { type: "error"; code: string; message: string };

/** Provider adapter interface */
export interface ProviderAdapter {
  complete(
    messages: import("./generated.js").Message[],
    tools: import("./generated.js").ToolDefinition[],
  ): AsyncIterable<ProviderEvent>;
}

/** Tool execution result */
export interface ToolResult {
  id: string;
  output?: string;
  error?: string;
}

/** Tool executor interface */
export interface ToolExecutor {
  execute(
    name: string,
    arguments_: Record<string, unknown>,
  ): Promise<ToolResult>;
  listTools(): import("./generated.js").ToolDefinition[];
}

/** Memory tool result */
export interface MemoryResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** File content returned by memory read */
export interface FileContent {
  path: string;
  content: string;
  modified_at: string;
}

/** Search match from memory search */
export interface SearchMatch {
  path: string;
  line: number;
  content: string;
  context?: string;
}

/** Directory listing entry */
export interface ListEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  modified_at: string;
  size?: number;
}

/** Version history entry */
export interface HistoryEntry {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  diff?: string;
}

/** Memory tools interface */
export interface MemoryTools {
  read(params: { path: string }): Promise<FileContent>;
  write(params: { path: string; content: string }): Promise<MemoryResult>;
  edit(params: {
    path: string;
    old_content: string;
    new_content: string;
  }): Promise<MemoryResult>;
  delete(params: { path: string }): Promise<MemoryResult>;
  search(params: {
    query: string;
    path?: string;
    type?: "content" | "filename";
  }): Promise<SearchMatch[]>;
  list(params: { path: string; recursive?: boolean }): Promise<ListEntry[]>;
  history(params: { path: string; limit?: number }): Promise<HistoryEntry[]>;
}

/** Auth provider interface */
export interface AuthProvider {
  authenticate(credential: string): Promise<import("./generated.js").ActorIdentity | null>;
  authorize(
    identity: import("./generated.js").ActorIdentity,
    resource: string,
    action: string,
  ): Promise<AuthDecision>;
}

/** Auth decision */
export interface AuthDecision {
  allowed: boolean;
  reason?: string;
}

/** Auth middleware result */
export type AuthResult =
  | {
      authenticated: true;
      identity: import("./generated.js").ActorIdentity;
      headers: { "X-Actor-ID": string; "X-Actor-Permissions": string };
    }
  | { authenticated: false; error: string };

/** Conversation store interface */
export interface ConversationStore {
  create(): Promise<Conversation>;
  get(id: string): Promise<Conversation | null>;
  list(query?: {
    limit?: number;
    offset?: number;
  }): Promise<ConversationSummary[]>;
  appendMessage(
    id: string,
    message: import("./generated.js").Message,
  ): Promise<void>;
}

/** Conversation */
export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  messages: import("./generated.js").Message[];
}

/** Conversation summary for listing */
export interface ConversationSummary {
  id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}
