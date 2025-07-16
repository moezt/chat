import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message } from "../shared";

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  messages = [] as ChatMessage[];

  broadcastMessage(message: Message, exclude?: string[]) {
    this.broadcast(JSON.stringify(message), exclude);
  }

  onStart() {
    // Initialize database with proper schema migration
    try {
      // First, try to create the table with the full schema
      this.ctx.storage.sql.exec(
        `CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY, 
          user TEXT, 
          role TEXT, 
          content TEXT,
          replyTo TEXT,
          timestamp INTEGER DEFAULT 0
        )`,
      );

      // Check if table exists and get its structure
      const tableInfo = this.ctx.storage.sql.exec(`PRAGMA table_info(messages)`).toArray();
      const columnNames = tableInfo.map((col: any) => col.name);

      // Add missing columns for existing databases
      if (!columnNames.includes('replyTo')) {
        try {
          this.ctx.storage.sql.exec(`ALTER TABLE messages ADD COLUMN replyTo TEXT`);
          console.log('Added replyTo column to existing table');
        } catch (e) {
          console.error('Failed to add replyTo column:', e);
        }
      }

      if (!columnNames.includes('timestamp')) {
        try {
          this.ctx.storage.sql.exec(`ALTER TABLE messages ADD COLUMN timestamp INTEGER DEFAULT 0`);
          console.log('Added timestamp column to existing table');
        } catch (e) {
          console.error('Failed to add timestamp column:', e);
        }
      }

      // Load messages from database with proper error handling
      this.loadMessagesFromDatabase();

    } catch (error) {
      console.error('Database initialization error:', error);
      // Initialize empty messages array as fallback
      this.messages = [];
    }
  }

  private loadMessagesFromDatabase() {
    try {
      // First, verify the table structure again after migrations
      const tableInfo = this.ctx.storage.sql.exec(`PRAGMA table_info(messages)`).toArray();
      const columnNames = tableInfo.map((col: any) => col.name);
      
      let rawMessages;
      
      if (columnNames.includes('timestamp')) {
        // Use timestamp ordering if column exists
        rawMessages = this.ctx.storage.sql
          .exec(`SELECT * FROM messages ORDER BY timestamp ASC, id ASC`)
          .toArray();
      } else {
        // Fallback to basic query without timestamp ordering
        rawMessages = this.ctx.storage.sql
          .exec(`SELECT * FROM messages ORDER BY id ASC`)
          .toArray();
      }

      // Convert raw messages to ChatMessage type
      this.messages = rawMessages.map(msg => {
        const chatMsg: ChatMessage = {
          id: msg.id as string,
          user: msg.user as string,
          role: msg.role as "user" | "assistant",
          content: msg.content as string,
          timestamp: msg.timestamp ? Number(msg.timestamp) : Date.now()
        };

        // Parse replyTo if it exists
        if (msg.replyTo) {
          try {
            chatMsg.replyTo = JSON.parse(msg.replyTo as string);
          } catch (e) {
            console.warn('Failed to parse replyTo for message:', msg.id, e);
          }
        }

        return chatMsg;
      });

      console.log(`Loaded ${this.messages.length} messages from database`);
      
    } catch (error) {
      console.error('Error loading messages from database:', error);
      this.messages = [];
    }
  }

  onConnect(connection: Connection) {
    // 发送现有消息给新连接的客户端
    if (this.messages.length > 0) {
      connection.send(
        JSON.stringify({
          type: "all",
          messages: this.messages,
        } satisfies Message),
      );
    }
  }

  saveMessage(message: ChatMessage) {
    // Ensure timestamp exists
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    // check if the message already exists in memory
    const existingIndex = this.messages.findIndex((m) => m.id === message.id);
    if (existingIndex !== -1) {
      // Update existing message
      this.messages[existingIndex] = message;
    } else {
      // Add new message
      this.messages.push(message);
    }

    // Convert replyTo to string for storage
    const replyToStr = message.replyTo ? JSON.stringify(message.replyTo) : null;

    try {
      // Use prepared statement approach to avoid SQL injection and escaping issues
      this.ctx.storage.sql.exec(
        `INSERT OR REPLACE INTO messages (id, user, role, content, replyTo, timestamp) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        message.id,
        message.user,
        message.role,
        message.content,
        replyToStr,
        message.timestamp
      );
    } catch (error) {
      console.error('Error saving message:', error);
      // Fallback: try to save without replyTo if there's an issue
      try {
        this.ctx.storage.sql.exec(
          `INSERT OR REPLACE INTO messages (id, user, role, content, timestamp) 
           VALUES (?, ?, ?, ?, ?)`,
          message.id,
          message.user,
          message.role,
          message.content,
          message.timestamp
        );
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError);
      }
    }
  }

  onMessage(connection: Connection, message: WSMessage) {
    // 解析消息
    const parsed = JSON.parse(message as string) as Message;

    // 根据消息类型处理
    if (parsed.type === "add" || parsed.type === "update") {
      // 保存聊天消息到存储
      this.saveMessage(parsed);
      // 广播给所有客户端（包括发送者，确保消息同步）
      this.broadcastMessage(parsed);
    } else if (parsed.type === "typing" || parsed.type === "read") {
      // 对于状态类消息，只广播不保存
      this.broadcastMessage(parsed);
    } else {
      // 其他类型的消息直接广播
      this.broadcast(message);
    }
  }
}

export default {
  async fetch(request, env) {
    return (
      (await routePartykitRequest(request, { ...env })) ||
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;
