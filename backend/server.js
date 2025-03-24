import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'https://byte-talk-8wwm.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors(
  {
  origin: '*',
  methods: ['GET', 'POST'],
}
));
app.use(express.json({ limit: '50mb' }));

// Track active users and their sockets
const users = new Map();

// Track active chats and their messages
const chats = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user login
  socket.on('login', ({ username }) => {
    if (!username.trim()) return;

    const userId = socket.id;
    users.set(userId, { id: userId, username });
    console.log(`${username} logged in`);

    // Notify all other users about the new user
    io.emit('user_connected', { id: userId, username });

    // Send chat history for all existing chats
    chats.forEach((chatMessages, chatId) => {
      socket.join(chatId);
      chatMessages.forEach((message) => {
        socket.emit('receive_message', message);
      });
    });
  });

  // Create a new chat room
  socket.on('create_chat', ({ chatName, username }) => {
    const chatId = `chat-${Date.now()}`; // Generate a unique chat ID
    chats.set(chatId, []);

    // Notify all clients about the new chat
    io.emit('new_chat', { id: chatId, name: chatName, lastMessage: 'New chat created' });

    console.log(`New chat created: ${chatName}`);
  });

  // Join a chat room
  socket.on('join_chat', ({ chatId, username }) => {
    if (!chatId || !username) return;

    console.log(`${username} joined chat ${chatId}`);
    socket.join(chatId);

    // Notify others in the chat that a user has joined
    io.to(chatId).emit('receive_message', {
      chatId,
      message: `${username} has joined the chat`,
      author: 'System',
      time: new Date().toLocaleTimeString(),
    });
  });

  // Leave a chat room
  socket.on('leave_chat', ({ chatId, username }) => {
    if (!chatId || !username) return;

    console.log(`${username} left chat ${chatId}`);
    socket.leave(chatId);

    // Notify others in the chat that a user has left
    io.to(chatId).emit('receive_message', {
      chatId,
      message: `${username} has left the chat`,
      author: 'System',
      time: new Date().toLocaleTimeString(),
    });
  });

  // Send a message to the chat
  socket.on('send_message', (data) => {
    const { chatId, message, author } = data;
    if (!chatId || !message.trim() || !author) return;

    const formattedMessage = {
      chatId,
      message,
      author,
      time: new Date().toLocaleTimeString(),
    };

    // Save the message to chat history
    if (!chats.has(chatId)) {
      chats.set(chatId, []);
    }
    chats.get(chatId).push(formattedMessage);

    // Broadcast the message to all users in the chat room
    io.to(chatId).emit('receive_message', formattedMessage);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const user = users.get(socket.id);
    if (user) {
      console.log(`${user.username} disconnected`);
      users.delete(socket.id);
      io.emit('user_disconnected', user); // Notify others about disconnected user
    }
  });
});

// Start the server
const PORT = 5000; // You can change this port if needed
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
