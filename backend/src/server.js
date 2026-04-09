const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS for Express
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());

app.get("/", (req, res) => res.json({ msg: "🎉 Server is running!" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/quiz", require("./routes/quiz"));
app.use("/api/session", require("./routes/session"));
app.use("/api/analytics", require("./routes/analytics"));

require("./socket/socketHandler")(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
