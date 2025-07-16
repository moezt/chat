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
    // this is where you can initialize things that need to be done before the server starts
    // for example, load previous messages from a database or a service

    // create the messages table if it doesn't exist with updated schema
    this.ctx.storage.sql.exec(
      `CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY, 
        user TEXT, 
        role TEXT, 
        content TEXT,
        replyTo TEXT,
        timestamp INTEGER
      )`,
    );

    // load the messages from the database, ordered by timestamp
    const rawMessages = this.ctx.storage.sql
      .exec(`SELECT * FROM messages ORDER BY timestamp ASC`)
      .toArray();
      
    // Convert raw messages to ChatMessage type with proper parsing of replyTo
    this.messages = rawMessages.map(msg => {
      const chatMsg: ChatMessage = {
        id: msg.id as string,
        user: msg.user as string,
        role: msg.role as "user" | "assistant",
        content: msg.content as string,
        timestamp: msg.timestamp ? Number(msg.timestamp) : Date.now()
      };
      
      if (msg.replyTo) {
        try {
          chatMsg.replyTo = JSON.parse(msg.replyTo as string);
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      return chatMsg;
    });
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
