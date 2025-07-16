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

    // load the messages from the database
    const rawMessages = this.ctx.storage.sql
      .exec(`SELECT * FROM messages`)
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
    connection.send(
      JSON.stringify({
        type: "all",
        messages: this.messages,
      } satisfies Message),
    );
  }

  saveMessage(message: ChatMessage) {
    // check if the message already exists
    const existingMessage = this.messages.find((m) => m.id === message.id);
    if (existingMessage) {
      this.messages = this.messages.map((m) => {
        if (m.id === message.id) {
          return message;
        }
        return m;
      });
    } else {
      this.messages.push(message);
    }

    // Ensure timestamp exists
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    // Convert replyTo to string for storage
    const replyToStr = message.replyTo ? JSON.stringify(message.replyTo) : null;

    this.ctx.storage.sql.exec(
      `INSERT INTO messages (id, user, role, content, replyTo, timestamp) 
       VALUES ('${message.id}', '${message.user}', '${message.role}', 
       ${JSON.stringify(message.content)}, 
       ${replyToStr ? JSON.stringify(replyToStr) : 'NULL'}, 
       ${message.timestamp}) 
       ON CONFLICT (id) DO UPDATE SET 
       content = ${JSON.stringify(message.content)},
       replyTo = ${replyToStr ? JSON.stringify(replyToStr) : 'NULL'},
       timestamp = ${message.timestamp}`,
    );
  }

  onMessage(connection: Connection, message: WSMessage) {
    // 解析消息
    const parsed = JSON.parse(message as string) as Message;
    
    // 根据消息类型处理
    if (parsed.type === "add" || parsed.type === "update") {
      // 保存聊天消息到存储
      this.saveMessage(parsed);
      // 广播给所有客户端
      this.broadcast(message);
    } else if (parsed.type === "typing" || parsed.type === "read") {
      // 对于状态类消息，只广播不保存
      this.broadcast(message);
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
