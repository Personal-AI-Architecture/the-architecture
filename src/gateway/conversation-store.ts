import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import type {
  Conversation,
  ConversationStore,
  ConversationSummary,
  Message,
} from "../types/index.js";

interface ConversationRow {
  id: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  role: Message["role"];
  content: string;
  tool_calls: string | null;
  tool_call_id: string | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function parseToolCalls(raw: string | null): Message["tool_calls"] | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as Message["tool_calls"];
  } catch {
    return undefined;
  }
}

function mapMessage(row: MessageRow): Message {
  const mapped: Message = {
    role: row.role,
    content: row.content,
  };

  const toolCalls = parseToolCalls(row.tool_calls);
  if (toolCalls) {
    mapped.tool_calls = toolCalls;
  }

  if (row.tool_call_id !== null) {
    mapped.tool_call_id = row.tool_call_id;
  }

  return mapped;
}

export function createConversationStore(dbPath: string): ConversationStore {
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls TEXT,
      tool_call_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
    );
  `);

  const insertConversation = db.prepare(`
    INSERT INTO conversations (id, created_at, updated_at)
    VALUES (?, ?, ?)
  `);

  const selectConversation = db.prepare(`
    SELECT id, created_at, updated_at
    FROM conversations
    WHERE id = ?
  `);

  const selectMessages = db.prepare(`
    SELECT role, content, tool_calls, tool_call_id
    FROM messages
    WHERE conversation_id = ?
    ORDER BY id ASC
  `);

  const listConversations = db.prepare(`
    SELECT
      c.id,
      c.created_at,
      c.updated_at,
      COUNT(m.id) AS message_count
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    LIMIT ? OFFSET ?
  `);

  const insertMessage = db.prepare(`
    INSERT INTO messages (
      conversation_id,
      role,
      content,
      tool_calls,
      tool_call_id,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const updateConversation = db.prepare(`
    UPDATE conversations
    SET updated_at = ?
    WHERE id = ?
  `);

  const appendMessageTxn = db.transaction((id: string, message: Message) => {
    const existing = selectConversation.get(id) as ConversationRow | undefined;
    if (!existing) {
      throw new Error(`Conversation not found: ${id}`);
    }

    const timestamp = nowIso();
    insertMessage.run(
      id,
      message.role,
      message.content,
      message.tool_calls ? JSON.stringify(message.tool_calls) : null,
      message.tool_call_id ?? null,
      timestamp,
    );
    updateConversation.run(timestamp, id);
  });

  return {
    async create(): Promise<Conversation> {
      const id = randomUUID();
      const createdAt = nowIso();

      insertConversation.run(id, createdAt, createdAt);

      return {
        id,
        created_at: createdAt,
        updated_at: createdAt,
        messages: [],
      };
    },

    async get(id: string): Promise<Conversation | null> {
      const conversation = selectConversation.get(id) as ConversationRow | undefined;
      if (!conversation) {
        return null;
      }

      const messages = (selectMessages.all(id) as MessageRow[]).map(mapMessage);
      return {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        messages,
      };
    },

    async list(query?: {
      limit?: number;
      offset?: number;
    }): Promise<ConversationSummary[]> {
      const limit = query?.limit ?? -1;
      const offset = query?.offset ?? 0;

      const rows = listConversations.all(limit, offset) as Array<{
        id: string;
        created_at: string;
        updated_at: string;
        message_count: number;
      }>;

      return rows.map((row) => ({
        id: row.id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        message_count: row.message_count,
      }));
    },

    async appendMessage(id: string, message: Message): Promise<void> {
      appendMessageTxn(id, message);
    },
  };
}
