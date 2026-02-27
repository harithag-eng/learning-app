import express from "express";
import cors from "cors";

import categoriesRoutes from "./routes/categories.routes";
import questionsRoutes from "./routes/questions.routes";
import { errorHandler } from "./middleware/errorHandler";
import authRouets from "./routes/auth.routes"

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "StackPrep API running " });
});

// Routes
app.use("/api/auth",authRouets);
app.use("/api/categories", categoriesRoutes);
app.use("/api/questions", questionsRoutes);

// Global error handler
app.use(errorHandler);

export default app;
