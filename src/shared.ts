export type ChatMessage = {
  id: string;
  content: string;
  user: string;
  role: "user" | "assistant";
};

export type Message =
  | {
    type: "add";
    id: string;
    content: string;
    user: string;
    role: "user" | "assistant";
  }
  | {
    type: "update";
    id: string;
    content: string;
    user: string;
    role: "user" | "assistant";
  }
  | {
    type: "all";
    messages: ChatMessage[];
  };

export const names = [
  "蔡徐鲲",
  "鸡你太美",
  "只因你太美",
  "练习时长两年半",
  "个人练习生",
  "唱跳rap篮球",
  "ikun永不为奴",
  "小黑子露出鸡脚了",
  "哥哥别杀我",
  "真下头",
  "芜湖起飞",
  "奥利给",
  "老铁666",
  "双击666",
  "家人们谁懂啊",
  "绝绝子",
  "yyds",
  "破防了",
  "CPU烧了",
  "纯路人",
  "理性讨论",
  "建议多看",
  "有一说一",
  "不懂就问",
  "坐等后续",
  "瓜已就位",
];
