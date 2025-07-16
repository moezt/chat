import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState, useRef, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
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
} from "@mui/material";
import { Send as SendIcon, Chat as ChatIcon } from "@mui/icons-material";

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

function App() {
  const [name] = useState(names[Math.floor(Math.random() * names.length)]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { room } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const socket = usePartySocket({
    party: "chat",
    room,
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
              label={`房间: ${room?.slice(0, 8)}...`} 
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
      <Route path="/" element={<Navigate to={`/${nanoid()}`} />} />
      <Route path="/:room" element={<App />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </BrowserRouter>,
);
