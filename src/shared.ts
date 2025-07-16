export type ChatMessage = {
  id: string;
  content: string;
  user: string;
  role: "user" | "assistant";
  replyTo?: ChatMessage; // 支持无限嵌套引用
  timestamp: number;
};

export type Message =
  | {
    type: "add";
    id: string;
    content: string;
    user: string;
    role: "user" | "assistant";
    replyTo?: ChatMessage; // 支持无限嵌套引用
    timestamp: number;
  }
  | {
    type: "update";
    id: string;
    content: string;
    user: string;
    role: "user" | "assistant";
    replyTo?: ChatMessage; // 支持无限嵌套引用
    timestamp: number;
  }
  | {
    type: "all";
    messages: ChatMessage[];
  }
  | {
    type: "typing";
    user: string;
    isTyping: boolean;
  }
  | {
    type: "read";
    user: string;
    lastRead: number;
  };

export const names = [
  "蔡徐鲲",
  "鸡你太美",
  "只因你太美",
  "Atm",
  "个人练习生",
  "唱跳rap篮球",
  "Tips",
  "猴子",
  "哥哥别杀我",
  "真下头",
  "芜湖起飞",
  "奥利给",
  "管理猴子",
  "普通猴子",
  "家人们谁懂啊",
  "绝绝子",
  "yyds",
  "破防了",
  "CPU烧了",
  "纯路人",
  "理性讨论",
  "建议多看",
  "有一说一",
  "弗-弗洛伊德",
  "孤独者们",
  "瓜已就位",
];
