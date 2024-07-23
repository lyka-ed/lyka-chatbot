const socket = io();

const username = localStorage.getItem("username");

const chatIcon = document.getElementById("chatIcon");
const chatContainer = document.getElementById("chatContainer");
const loginContainer = document.getElementById("loginContainer");
const signinButton = document.getElementById("signinButton");
const minimizeButton = document.getElementById("minimizeButton");
const logoutButton = document.getElementById("logoutButton");
const chat = document.getElementById("chat");
const chatForm = document.getElementById("chatForm");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");
const usernameInput = document.getElementById("usernameInput");
const messageInput = document.getElementById("input");

const showChat = () => {
  loginContainer.style.display = "none";
  chat.style.display = "block";
  chatForm.style.display = "flex";
};

const showLogin = () => {
  loginContainer.style.display = "flex";
  chat.style.display = "none";
  chatForm.style.display = "none";
};

chatIcon.addEventListener("click", () => {
  chatContainer.style.display = "flex";
  chatIcon.style.display = "none";

  if (username) {
    showChat();
  } else {
    showLogin();
  }
});

minimizeButton.addEventListener("click", () => {
  chatContainer.style.display = "none";
  chatIcon.style.display = "block";
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("username");
  messages.innerHTML = "";
  showLogin();
});

signinButton.addEventListener("click", (e) => {
  e.preventDefault();
  const newUsername = usernameInput.value.trim();
  if (newUsername) {
    localStorage.setItem("username", newUsername);
    showChat();
    socket.emit("username", newUsername);
  }
});

const appendMessage = (message, timestamp, className) => {
  const messageElement = document.createElement("li");
  messageElement.innerHTML = `<div>${message}</div><span class="timestamp">${timestamp}</span>`;
  messageElement.className = className;

  messages.appendChild(messageElement);
  chat.scrollTop = messages.scrollHeight;
};

socket.on("message", ({ message, timestamp }) => {
  appendMessage(message, timestamp, "bot");
});

socket.on("error", (message) => {
  logoutButton.click();
});

sendButton.addEventListener("click", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  if (message.trim() !== "") {
    socket.emit("userInput", message);
    appendMessage(
      message,
      `${new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      "user"
    );
    messageInput.value = "";
  }
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendButton.click();
  }
});
