const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const { createServer } = require("http");
const { join } = require("path");
const { Sequelize } = require("sequelize");
const { Server } = require("socket.io");
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const Chatbot = require("./src/bot");
const User = require("./src/user.order");

// Create Express app and HTTP server
const app = express();
dotenv.config();
const PORT = process.env.PORT;
const server = createServer(app);

// Create Socket.io instance
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static(join(__dirname, "public")));

// Sequelize setup
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

// Session store configuration using Sequelize
const sessionStore = new SequelizeStore({
  db: sequelize,
});

// Session middleware configuration
const sessionMiddleware = session({
  secret: process.env.SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
});

// Session middleware to Express app
app.use(sessionMiddleware);

sessionStore.sync();

// Session middleware to Socket.io
io.engine.use(sessionMiddleware);

// Initialize B instance with Socket.io
const chatbot = new Chatbot(io);

// Handle Socket.io connections
io.on("connection", (socket) => {
  const reqSession = socket.request.session;
  const sessionId = reqSession.id;
  socket.join(sessionId);

  if (reqSession.user) {
    const user = User.getUser(reqSession.user);
    chatbot.sendMessage(user, `Welcome Back ${user.username}!`);
    chatbot.sendMessage(user, chatbot.initialMessage);
  } else {
    socket.emit("error");
  }

  // Handle 'username' event from the client
  socket.on("username", (username) => {
    if (!reqSession.users) {
      reqSession.users = {};
    }

    const userId = User.generateKey(username, sessionId);
    let user;

    if (!reqSession.users[userId]) {
      user = new User(username, sessionId);
      reqSession.users[userId] = user;
      chatbot.sendMessage(user, `Welcome to Ly's Ristorante, ${username}!`);
    } else {
      user = User.getUser(reqSession.user);
      chatbot.sendMessage(
        reqSession.users[userId],
        `Welcome Back ${username}!`
      );
    }

    reqSession.user = user;
    chatbot.sendMessage(user, chatbot.initialMessage);
    reqSession.save();
  });

  socket.on("userInput", (input) => {
    if (reqSession.user) {
      chatbot.handleUserInput(reqSession, input);
    } else {
      socket.emit("error", "Session not found");
    }

    reqSession.save();
  });
});

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public/index.html"));
});

server.listen(PORT, () => {
  console.log(`The Restarant Bot is running at localhost ${PORT} `);
});
