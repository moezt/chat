import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router";
import { nanoid } from "nanoid";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Box,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Popover,
  Button,
  Tooltip,
  useMediaQuery,
  alpha,
} from "@mui/material";
import {
  Send as SendIcon,
  Chat as ChatIcon,
  EmojiEmotions as EmojiIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  MarkChatRead as MarkChatReadIcon,
} from "@mui/icons-material";

import { names, type ChatMessage, type Message } from "../shared";

// 递归引用组件
const NestedQuote: React.FC<{
  message: ChatMessage;
  depth?: number;
  maxDepth?: number;
  theme: any;
}> = ({ message, depth = 0, maxDepth = 3, theme }) => {
  // 限制嵌套深度，避免无限递归
  if (depth >= maxDepth) {
    return (
      <Box
        sx={{
          mt: 0.5,
          p: 1,
          borderLeft: `2px solid ${theme.palette.grey[400]}`,
          bgcolor: alpha(theme.palette.grey[500], 0.05),
          borderRadius: '0 4px 4px 0',
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          ... 更多引用层级
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        mt: 0.5,
        p: 1,
        borderLeft: `3px solid ${theme.palette.primary.main}`,
        bgcolor: alpha(theme.palette.primary.main, 0.05),
        borderRadius: '0 4px 4px 0',
        mb: depth === 0 ? 1 : 0.5,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
        回复 {message.user}:
      </Typography>

      {/* 如果有嵌套引用，递归显示 */}
      {message.replyTo && (
        <NestedQuote
          message={message.replyTo}
          depth={depth + 1}
          maxDepth={maxDepth}
          theme={theme}
        />
      )}

      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {message.content.length > 50
          ? message.content.substring(0, 50) + '...'
          : message.content}
      </Typography>
    </Box>
  );
};

// 创建主题函数，支持黑暗模式
const createAppTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#1976d2' : '#90caf9',
    },
    secondary: {
      main: mode === 'light' ? '#dc004e' : '#f48fb1',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// 颜文字数据
const kaomojis = [
  {
    title: "常用",
    items: ["(　^ω^)"],
  },
  {
    title: "哈 ∀",
    items: [
      "(・∀・)",
      "(ﾟ∀ﾟ)",
      "(*ﾟ∀ﾟ*)",
      "(´∀`)",
      "(*´∀`)",
      "(〃∀〃)",
      "(//∇//)",
      "(ゝ∀･)",
      "ﾟ ∀ﾟ)ノ",
      "(ノﾟ∀ﾟ)ノ",
      "( へ ﾟ∀ﾟ)べ",
      "(*ﾟ∇ﾟ)",
      "(＾o＾)ﾉ",
      "ᕕ( ᐛ )ᕗ",
      "ε=ε=(ノ≧∇≦)ノ",
      "(`ヮ´)",
      "(`ゥ´ )",
      "↙(`ヮ´ )↗",
      "･ﾟ( ﾉヮ´ )",
      "(;´ヮ`)7",
      "=͟͟͞͞( 'ヮ' 三 'ヮ' =͟͟͞͞)",
    ],
  },
  {
    title: "蛤 σ",
    items: [
      "σ`∀´)",
      "ﾟ∀ﾟ)σ",
      "(σﾟ∀ﾟ)σ",
      "(ﾟ∀。)",
      '( ﾟ∀。)7"',
      "ᕕ( ﾟ∀。)ᕗ",
      "(`ヮ´ )σ`∀´) ﾟ∀ﾟ)σ",
    ],
  },
  {
    title: "唔 ω",
    items: [
      "(·ω·)",
      "(・ω・)",
      "(｀･ω･)",
      "(｀・ω)",
      "(´・ω)",
      "(`・ω・´)",
      "(´・ω・`)",
      "(=・ω・=)",
      "(/ω＼)",
      "(^・ω・^)",
      "(*´ω`*)",
      "(ﾟωﾟ)",
      "( ﾟωﾟ)",
      "(oﾟωﾟo)",
      "(=ﾟωﾟ)=",
      "⊂( ﾟωﾟ)つ",
      "ฅ(^ω^ฅ)",
      "(´；ω；`)",
      "ヾ(´ωﾟ｀)",
      "（<ゝω・）☆",
      "(　↺ω↺)",
      "(ﾉ)`ω´(ヾ)",
      "( ›´ω`‹ )",
      "乁( ˙ ω˙乁)",
      "( *・ω・)✄╰ひ╯",
    ],
  },
  {
    title: "呵 ^",
    items: [
      "(^ω^)",
      "( ^ω^)",
      "(　^ω^)",
      "(　ˇωˇ)",
      "(ベ ˇωˇ)べ",
      "⁽ ^ᐜ^⁾",
      "⁽ ˆ꒳ˆ⁾",
      "⁽ ˇᐜˇ⁾",
      "(｡◕∀◕｡)",
      "(　ˇωˇ )◕∀◕｡)^ω^)",
    ],
  },
  {
    title: "惊 дﾟ",
    items: [
      "(ﾟдﾟ)",
      "(;ﾟдﾟ)",
      "Σ( ﾟдﾟ)",
      "Σ(ﾟдﾟ;)",
      "(´ﾟДﾟ`)",
      "(´ﾟДﾟ`)？？？",
      "(σﾟдﾟ)σ",
      "(つд⊂)",
      "ﾟÅﾟ )",
      "(|||ﾟдﾟ)",
      "(　д ) ﾟ ﾟ",
      "(((ﾟдﾟ)))",
      "(((　ﾟдﾟ)))",
      "(ﾟДﾟ≡ﾟДﾟ)",
      "(ﾟДﾟ≡ﾟдﾟ)!?",
      "Σ(っ °Д °;)っ",
      "(☉д⊙)",
    ],
  },
  {
    title: "怒 д´",
    items: [
      "(`д´)",
      "ヽ(`Д´)ﾉ",
      "m9( `д´)",
      "( `д´)9",
      "( `д´)σ",
      "(σﾟдﾟ)σ",
      "(#ﾟдﾟ)",
      "(╬ﾟдﾟ)",
      "( ｣ﾟДﾟ)｣＜",
      "(`・´)",
      "( ` ・´)",
      "( ᑭ`д´)ᓀ))д`)",
      "( ᑭ`д´)ᓀ))д´)ᑫ",
      "ᑭ`д´)ᓀ ∑ᑭ(`ヮ´ )ᑫ",
      "`ー´) `д´) `д´)",
    ],
  },
  {
    title: "悲 Д`",
    items: [
      "(>д<)",
      "(´д`)",
      "( ´д`)",
      "(*´д`)",
      "(;´Д`)",
      "(/TДT)/",
      "(TдT)",
      "( TдT)",
      "(-д-)",
      "ﾟ(つд`ﾟ)",
      "･ﾟ( ﾉд`ﾟ)",
      "( ;`д´; )",
    ],
  },
  {
    title: "無 _",
    items: [
      "( ·_ゝ·)",
      "(・_ゝ・)",
      "(´_ゝ`)",
      "( ´_ゝ`)旦",
      "(´_っ`)",
      "( `_っ´)",
      "((;¬_¬)",
      "(´･_･`)",
      "(´ー`)",
      "(`ー´)",
      "(*ﾟーﾟ)",
      "(・ー・)",
      "←_←",
      "→_→",
      "(<_<)",
      "(>_>)",
      "( ・_ゝ・) ﾉд`ﾟ)´д`)´ﾟДﾟ`)",
      "摸摸( ´･･)ﾉ(._.`)",
    ],
  },
  {
    title: "躲 |",
    items: ["|∀ﾟ)", "|∀`)", "|д`)", "|дﾟ)", "| ω・´)", "|ー`)", "|-`)"],
  },
  {
    title: "汗 |||",
    items: ["(|||^ヮ^)", "(|||ˇヮˇ)"],
  },
  {
    title: "拳 ⊂彡",
    items: ["⊂彡☆))д´)", "⊂彡☆))д`)", "⊂彡☆))∀`)", "(´∀((☆ミつ"],
  },
  {
    title: "亲 ε",
    items: ["(ﾟ3ﾟ)", "(`ε´)", "(`ε´ )", "ヾ(´ε`ヾ)", "(`ε´ (つ*⊂)"],
  },
  {
    title: "￣",
    items: [
      "(￣∇￣)",
      "╮(￣▽￣)╭",
      "(￣3￣)",
      "(￣ε(#￣)",
      "(￣ｰ￣)",
      "(￣ . ￣)",
      "(￣皿￣)",
      "(￣艸￣)",
      "(￣︿￣)",
      "（￣へ￣）",
      "(￣︶￣)",
      "(〜￣△￣)〜",
      "Σ( ￣□￣||)",
      '("▔□▔)/',
      "(●￣(ｴ)￣●)",
    ],
  },
  {
    title: "其他",
    items: [
      "( ´ρ`)",
      "σ( ᑒ )",
      "( ﾟπ。)",
      "ᐕ)⁾⁾",
      "(っ˘Д˘)ノ♪",
      "U•ェ•*U",
      "/( ◕‿‿◕ )\\",
      "¯\\_(ツ)_/¯",
      "┃電柱┃",
      "接☆龙☆大☆成☆功",
      "(笑)",
      "(汗)",
      "(泣)",
      "(苦笑)",
      "☎110",
    ],
  },
];

function App() {
  // 基本状态
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 新增功能状态
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: boolean }>({});
  const [lastReadTimestamp, setLastReadTimestamp] = useState<number>(Date.now());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 系统偏好的颜色模式
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // 创建主题
  const theme = useMemo(
    () => createAppTheme(darkMode ? 'dark' : 'light'),
    [darkMode]
  );

  // 使用固定的房间ID，所有用户都在同一个房间
  const socket = usePartySocket({
    party: "chat",
    room: "里岛",
    onMessage: (evt) => {
      const message = JSON.parse(evt.data as string) as Message;

      if (message.type === "add") {
        const foundIndex = messages.findIndex((m) => m.id === message.id);
        if (foundIndex === -1) {
          setMessages((messages) => [
            ...messages,
            {
              id: message.id,
              content: message.content,
              user: message.user,
              role: message.role,
              replyTo: message.replyTo,
              timestamp: message.timestamp || Date.now(),
            },
          ]);

          // 如果消息是新的且不是自己发的，更新未读消息计数
          if (message.user !== name && message.timestamp > lastReadTimestamp) {
            // 播放提示音或其他通知
          }
        } else {
          setMessages((messages) => {
            return messages
              .slice(0, foundIndex)
              .concat({
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
                replyTo: message.replyTo,
                timestamp: message.timestamp || Date.now(),
              })
              .concat(messages.slice(foundIndex + 1));
          });
        }
      } else if (message.type === "update") {
        setMessages((messages) =>
          messages.map((m) =>
            m.id === message.id
              ? {
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
                replyTo: message.replyTo,
                timestamp: message.timestamp || m.timestamp,
              }
              : m,
          ),
        );
      } else if (message.type === "all") {
        setMessages(message.messages);
      } else if (message.type === "typing") {
        // 处理正在输入的状态
        if (message.user !== name) {
          setTypingUsers(prev => ({
            ...prev,
            [message.user]: message.isTyping
          }));
        }
      } else if (message.type === "read") {
        // 处理已读状态
        // 这里可以添加逻辑来显示消息已读状态
      }
    },
  });

  // 自动滚动到底部
  useEffect(() => {
    // 只有当消息是自己发的或者用户已经在底部时才自动滚动
    const shouldScroll = messages.length > 0 &&
      (messages[messages.length - 1].user === name ||
        Math.abs(
          (messagesEndRef.current?.getBoundingClientRect().bottom || 0) -
          window.innerHeight
        ) < 100);

    if (shouldScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, name]);

  // 处理输入状态
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 发送正在输入状态
    if (!isTyping && newValue.trim()) {
      setIsTyping(true);
      socket.send(
        JSON.stringify({
          type: "typing",
          user: name,
          isTyping: true,
        } satisfies Message),
      );
    }

    // 设置输入超时，停止输入后3秒发送停止输入状态
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        socket.send(
          JSON.stringify({
            type: "typing",
            user: name,
            isTyping: false,
          } satisfies Message),
        );
      }
    }, 3000);
  };

  // 处理消息提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // 创建消息对象
    const chatMessage: ChatMessage = {
      id: nanoid(8),
      content: inputValue,
      user: name,
      role: "user",
      timestamp: Date.now(),
      ...(replyTo ? { replyTo } : {})
    };

    // 更新本地消息列表
    setMessages((messages) => [...messages, chatMessage]);

    // 发送消息
    socket.send(
      JSON.stringify({
        type: "add",
        ...chatMessage,
      } satisfies Message),
    );

    // 清空输入框和引用状态
    setInputValue("");
    setReplyTo(null);

    // 发送停止输入状态
    if (isTyping) {
      setIsTyping(false);
      socket.send(
        JSON.stringify({
          type: "typing",
          user: name,
          isTyping: false,
        } satisfies Message),
      );
    }

    // 发送已读状态
    setLastReadTimestamp(Date.now());
    socket.send(
      JSON.stringify({
        type: "read",
        user: name,
        lastRead: Date.now(),
      } satisfies Message),
    );
  };

  // 处理回复消息
  const handleReply = (message: ChatMessage) => {
    setReplyTo(message);
  };

  // 取消回复
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  const getAvatarColor = (username: string) => {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'];
    const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // 表情相关函数
  const handleEmojiClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchorEl(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    handleEmojiClose();
  };

  const emojiOpen = Boolean(emojiAnchorEl);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* 顶部导航栏 */}
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <ChatIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              聊天室
            </Typography>
            <Chip
              label="里岛"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white', mr: 2 }}
            />
            <Tooltip title={darkMode ? "切换到亮色模式" : "切换到暗色模式"}>
              <IconButton
                color="inherit"
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  localStorage.setItem('darkMode', String(newMode));
                }}
              >
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        {/* 聊天消息区域 */}
        <Container maxWidth="md" sx={{ flex: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
          <Paper
            elevation={2}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
              {/* 未读消息计数 */}
              {messages.filter(m => m.timestamp > lastReadTimestamp && m.user !== name).length > 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <Chip
                    icon={<MarkChatReadIcon />}
                    label={`${messages.filter(m => m.timestamp > lastReadTimestamp && m.user !== name).length} 条未读消息`}
                    color="primary"
                    onClick={() => {
                      setLastReadTimestamp(Date.now());
                      socket.send(
                        JSON.stringify({
                          type: "read",
                          user: name,
                          lastRead: Date.now(),
                        } satisfies Message),
                      );
                      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </Box>
              )}

              {/* 消息列表 - 使用虚拟化列表优化性能 */}
              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      py: 1,
                      // 高亮显示未读消息
                      bgcolor: message.timestamp > lastReadTimestamp && message.user !== name
                        ? alpha(theme.palette.primary.main, 0.05)
                        : 'transparent',
                      borderRadius: 1
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(message.user),
                        mr: 2,
                        width: 40,
                        height: 40
                      }}
                    >
                      {message.user.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                          {message.user}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Typography>
                      </Box>

                      {/* 嵌套引用消息 */}
                      {message.replyTo && (
                        <NestedQuote
                          message={message.replyTo}
                          theme={theme}
                        />
                      )}

                      <ListItemText
                        primary={message.content}
                        sx={{ mt: 0.5 }}
                      />

                      {/* 消息操作按钮 */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleReply(message)}
                          sx={{ p: 0.5 }}
                        >
                          <ReplyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>

              {/* 输入状态提示 */}
              {Object.entries(typingUsers)
                .filter(([user, isTyping]) => isTyping)
                .map(([user]) => user)
                .length > 0 && (
                  <Box sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {Object.entries(typingUsers)
                        .filter(([user, isTyping]) => isTyping)
                        .map(([user]) => user)
                        .join(', ')} 正在输入...
                    </Typography>
                  </Box>
                )}

              <div ref={messagesEndRef} />
            </Box>

            {/* 回复预览区域 */}
            {replyTo && (
              <Box
                sx={{
                  p: 1.5,
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ReplyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                        回复消息:
                      </Typography>
                    </Box>
                    {/* 显示完整的嵌套引用结构 */}
                    <NestedQuote
                      message={replyTo}
                      theme={theme}
                      maxDepth={2} // 在预览区域限制深度
                    />
                  </Box>
                  <IconButton size="small" onClick={handleCancelReply} sx={{ ml: 1 }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* 输入区域 */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 2,
                borderTop: replyTo ? 0 : 1,
                borderColor: 'divider',
                display: 'flex',
                gap: 1
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder={`你好 ${name}! 输入一些信息吧...`}
                value={inputValue}
                onChange={handleInputChange}
                autoComplete="off"
                sx={{ flex: 1 }}
              />
              <IconButton
                onClick={handleEmojiClick}
                color="primary"
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white',
                  }
                }}
              >
                <EmojiIcon />
              </IconButton>
              <IconButton
                type="submit"
                color="primary"
                disabled={!inputValue.trim()}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                    color: 'grey.500',
                  }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>

            {/* 颜文字选择器 */}
            <Popover
              open={emojiOpen}
              anchorEl={emojiAnchorEl}
              onClose={handleEmojiClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
            >
              <Box sx={{ p: 2, maxWidth: 400, maxHeight: 500, overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  选择颜文字
                </Typography>
                {kaomojis.map((category, categoryIndex) => (
                  <Box key={categoryIndex} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                      {category.title}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {category.items.map((kaomoji, index) => (
                        <Button
                          key={index}
                          onClick={() => handleEmojiSelect(kaomoji)}
                          sx={{
                            minWidth: 'auto',
                            minHeight: 32,
                            fontSize: '0.9rem',
                            p: 0.5,
                            fontFamily: 'monospace',
                            '&:hover': {
                              bgcolor: 'primary.light',
                              color: 'white',
                            },
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {kaomoji}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Popover>
          </Paper>

          {/* 用户信息 */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Chip
              avatar={
                <Avatar sx={{ bgcolor: getAvatarColor(name) }}>
                  {name.charAt(0).toUpperCase()}
                </Avatar>
              }
              label={`当前用户: ${name}`}
              variant="outlined"
            />
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>,
);
