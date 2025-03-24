import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  Slide,
  Fade,
  Grow,
  useTheme,
  useMediaQuery,
  Drawer,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import './App.css'; // Import the CSS file

const BACKEND_URL = 'https://byte-talk.onrender.com';
const socket = io(BACKEND_URL);

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      if (currentChat === data.chatId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    socket.on('user_connected', (user) => {
      setUsers((prevUsers) => [...prevUsers, user]);
    });

    socket.on('user_disconnected', (user) => {
      setUsers((prevUsers) => prevUsers.filter(u => u.id !== user.id));
    });

    socket.on('new_chat', (newChat) => {
      setChats((prevChats) => [...prevChats, newChat]);
    });

    return () => {
      socket.off('receive_message');
      socket.off('user_connected');
      socket.off('user_disconnected');
      socket.off('new_chat');
    };
  }, [currentChat]);

  const login = () => {
    if (username.trim()) {
      socket.emit('login', { username });
      setIsLoggedIn(true);
    }
  };

  const createChat = () => {
    const chatName = prompt('Enter chat name:');
    if (chatName && chatName.trim()) {
      socket.emit('create_chat', { chatName, username });
    }
  };

  const joinChat = (chatId) => {
    if (!isLoggedIn) {
      alert('Please log in first!');
      return;
    }
    socket.emit('join_chat', { chatId, username });
    setCurrentChat(chatId);
    setMessages([]);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const leaveChat = () => {
    if (!currentChat) return;
    socket.emit('leave_chat', { chatId: currentChat, username });
    setCurrentChat(null);
    setMessages([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!isLoggedIn || !currentChat || !messageInput.trim()) return;
    const messageData = {
      chatId: currentChat,
      message: messageInput,
      author: username,
    };
    socket.emit('send_message', messageData);
    setMessageInput('');
  };

  const handleEmojiClick = (emojiObject, event) => {
    setMessageInput((prev) => prev + emojiObject.emoji);
  };

  if (!isLoggedIn) {
    return (
      <Container maxWidth="sm">
        <Box className="login-box">
          <Typography variant="h4" gutterBottom fontWeight={600} color='white'>
            Welcome to ByteTalk 🩷
          </Typography>
          <TextField
            fullWidth
            label="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
          />
          <Button variant="contained" onClick={login} size="large">
            Login ➡️
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="container">
      {/* Mobile Sidebar */}
      <Drawer
        anchor="left"
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { width: '70%', boxSizing: 'border-box' },
        }}
      >
        <Box className="sidebar-mobile">
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Chats
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button variant="outlined" onClick={createChat}>
              Create Chat
            </Button>
          </Box>
          <List sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {chats.map((chat) => (
              <Slide direction="up" in={true} key={chat.id}>
                <ListItem
                  button
                  onClick={() => joinChat(chat.id)}
                  className="message"
                >
                  <Avatar alt={chat.name} src="/broken-image.jpg" sx={{ mr: 2 }} />
                  <ListItemText
                    primary={chat.name}
                    secondary={chat.lastMessage}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem', color: '#666' }}
                  />
                </ListItem>
              </Slide>
            ))}
          </List>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4 }}>
            Other Users
          </Typography>
          <List sx={{ maxHeight: '20vh', overflowY: 'auto' }}>
            {users.length > 0 ? (
              users.map((user) => (
                <Fade in={true} timeout={500} key={user.id}>
                  <ListItem button className="message">
                    <Avatar alt={user.username} src="/broken-image.jpg" sx={{ mr: 2 }} />
                    <ListItemText
                      primary={user.username}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                  </ListItem>
                </Fade>
              ))
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', color: '#aaa' }}>
                No other users online.
              </Typography>
            )}
          </List>
        </Box>
      </Drawer>

      <Box sx={{ display: 'flex', height: '100%' }}>
        {/* Left Sidebar (Hidden on Mobile) */}
        <Box className="sidebar">
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Chats
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Button variant="outlined" onClick={createChat}>
              Create Chat
            </Button>
          </Box>
          <List sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {chats.map((chat) => (
              <Slide direction="up" in={true} key={chat.id}>
                <ListItem
                  button
                  onClick={() => joinChat(chat.id)}
                  className="message"
                >
                  <Avatar alt={chat.name} src="/broken-image.jpg" sx={{ mr: 2 }} />
                  <ListItemText
                    primary={chat.name}
                    secondary={chat.lastMessage}
                    primaryTypographyProps={{ fontWeight: 'bold' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem', color: '#666' }}
                  />
                </ListItem>
              </Slide>
            ))}
          </List>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 4 }}>
            Other Users
          </Typography>
          <List sx={{ maxHeight: '20vh', overflowY: 'auto' }}>
            {users.length > 0 ? (
              users.map((user) => (
                <Fade in={true} timeout={500} key={user.id}>
                  <ListItem button className="message">
                    <Avatar alt={user.username} src="/broken-image.jpg" sx={{ mr: 2 }} />
                    <ListItemText
                      primary={user.username}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                  </ListItem>
                </Fade>
              ))
            ) : (
              <Typography variant="body1" sx={{ textAlign: 'center', color: '#aaa' }}>
                No other users online.
              </Typography>
            )}
          </List>
        </Box>

        {/* Chat Panel */}
        <Box className="chat-panel">
          {isMobile && (
            <IconButton
              onClick={() => setIsSidebarOpen(true)}
              className="mobile-menu-button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </IconButton>
          )}
          {currentChat ? (
            <>
              <Box className="chat-header">
                <Typography variant="h5">
                  {chats.find((c) => c.id === currentChat)?.name}
                </Typography>
                <IconButton onClick={leaveChat} className="close-icon">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Grow in={!!currentChat}>
                <List className="chat-messages">
                  {messages.map((msg, index) => (
                    <Fade in={true} timeout={500} key={index}>
                      <ListItem
                        className={`message ${msg.author === username ? 'sent' : 'received'}`}
                      >
                        <ListItemText
                          primary={msg.message}
                          primaryTypographyProps={{
                            style: { wordBreak: 'break-word' },
                          }}
                          secondary={`${msg.author} - ${msg.time}`}
                          secondaryTypographyProps={{ fontSize: '0.8rem', color: '#666' }}
                        />
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              </Grow>
              <Box component="form" onSubmit={sendMessage} className="chat-input">
                <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <span role="img" aria-label="smile">😊</span>
                </IconButton>
                <TextField
                  fullWidth
                  label="Write a message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <Button type="submit" variant="contained" color="primary"> 
                  Send
                </Button>
              </Box>
              {showEmojiPicker && (
                <Box className="emoji-picker">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </Box>
              )}
            </>
          ) : (
            <Typography className='impomsg' variant="h5" sx={{ textAlign: 'center',mt: 20 }}>
              Select or create a chat to start messaging.
            </Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default App;
