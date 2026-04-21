import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { conversationsRouter } from "./routes/conversations.js";
import { messagesRouter } from "./routes/messages.js";
import { authRouter } from "./routes/auth.js";
import { dogsRouter } from "./routes/dogs.js";

export function createApp() {
  const app = express();

  app.use((req, res, next) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://bark-buddy.vercel.app",
    ];

    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(helmet({
    crossOriginResourcePolicy: false,
  }));

  app.use(express.json());
  app.use(morgan("dev"));

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/dogs", dogsRouter);
  app.use("/conversations", conversationsRouter);
  app.use("/messages", messagesRouter);

  return app;
}