import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import chatroutes from "./routes/chat.routes.js";
import compression from "compression";
import helmet from "helmet";
import mongoose from "mongoose";
import { maintenanceCheck } from "./middleware/admin.middleware.js";
const app = express();
const PORT = process.env.PORT || 5001;


app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(maintenanceCheck);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatroutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: "ROUTE_NOT_FOUND",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      code: "VALIDATION_ERROR",
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate field value",
      code: "DUPLICATE_KEY",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    code: "SERVER_ERROR",
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});


const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));


