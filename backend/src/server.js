import express from "express";
import "dotenv/config";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js"
import cookieParser from "cookie-parser"
import { connectDB } from "./lib/db.js";
import cors from "cors";
import chatroutes from "./routes/chat.routes.js"
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true
}));
app.use("/api/auth", authRoutes);
app.use("/api/user",userRoutes)
app.use("/api/chat",chatroutes)
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  // Handle ApiError instances
  if (err.StatusCode) {
    return res.status(err.StatusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  // Handle validation errors (Mongoose)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // Handle duplicate key error (MongoDB)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate field value",
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`server is presenting on port : ${PORT}`);
  connectDB();
});


