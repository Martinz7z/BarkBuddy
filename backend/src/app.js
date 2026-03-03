import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { authRouter } from "./routes/auth.js";
import { dogsRouter } from "./routes/dogs.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(express.json());

  app.use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: true,
    })
  );

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

  return app;
}