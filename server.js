require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

// Import routes
const authRoutes = require("./routes/auth");        // 🔑 Register/Login
const userRoutes = require("./routes/users");
const placementRoutes = require("./routes/placements");
const trainingRoutes = require("./routes/training");
const higherStudiesRoutes = require("./routes/higherStudies");
const chatbotRoutes = require("./routes/chatbot");
const adminRoutes = require("./routes/admin");

// Middleware
const { authenticateToken } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// -------------------- DATABASE --------------------
const mongoURI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campus_placement_portal";

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.warn("⚠️ MongoDB connection failed - running without database");
    console.warn("   To enable full features, install MongoDB or use MongoDB Atlas");
  });

// -------------------- SECURITY --------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // disable strict CSP for frontend scripts/fonts
  })
);

const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.RATE_LIMIT_MAX || 100, // max requests per window
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// -------------------- MIDDLEWARE --------------------
app.use(compression());
app.use(morgan("dev"));
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// -------------------- STATIC FILES --------------------
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------- API ROUTES --------------------
app.use("/api/auth", authRoutes);                  // 🔑 Authentication
app.use("/api/users", authenticateToken, userRoutes);
app.use("/api/placements", placementRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/higher-studies", higherStudiesRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/admin", authenticateToken, adminRoutes);

// -------------------- FRONTEND FALLBACK --------------------
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "public")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });
}

// -------------------- SOCKET.IO --------------------
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on("chat_message", (data) => {
    io.to(data.room).emit("chat_message", data);
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected:", socket.id);
  });
});

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
});

// -------------------- 404 ROUTE --------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Frontend served at: http://localhost:${PORT}`);
});

module.exports = { app, server, io };
