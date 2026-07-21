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

app.listen(PORT, () => {
  console.log(`server is presenting on port : ${PORT}`);
  connectDB();
});


