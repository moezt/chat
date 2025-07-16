import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState, useRef, useEffect } from "react";
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
  Grid,
  Button,
} from "@mui/material";
import { Send as SendIcon, Chat as ChatIcon, EmojiEmotions as EmojiIcon } from "@mui/icons-material";

import { names, type ChatMessage, type Message } from "../shared";

// Material-UI主题配置
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
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
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLButtonElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            },
          ]);
        } else {
          setMessages((messages) => {
            return messages
              .slice(0, foundIndex)
              .concat({
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
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
              }
              : m,
          ),
        );
      } else {
        setMessages(message.messages);
      }
    },
  });

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const chatMessage: ChatMessage = {
      id: nanoid(8),
      content: inputValue,
      user: name,
      role: "user",
    };

    setMessages((messages) => [...messages, chatMessage]);
    socket.send(
      JSON.stringify({
        type: "add",
        ...chatMessage,
      } satisfies Message),
    );
    setInputValue("");
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
              sx={{ color: 'white', borderColor: 'white' }}
            />
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
              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      py: 1
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
                      <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                        {message.user}
                      </Typography>
                      <ListItemText
                        primary={message.content}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
              <div ref={messagesEndRef} />
            </Box>

            {/* 输入区域 */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 2,
                borderTop: 1,
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
                onChange={(e) => setInputValue(e.target.value)}
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
