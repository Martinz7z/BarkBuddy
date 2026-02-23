import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { signAccessToken } from "../auth/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["BASIC_USER", "SHELTER"]),
  shelterName: z.string().min(2).optional()
});

authRouter.post("/register", async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, email, password, role, shelterName } = parsed.data;

  if (role === "SHELTER" && (!shelterName || shelterName.trim().length < 2)) {
    return res.status(400).json({ error: "shelterName is required for shelters" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      shelterProfile:
        role === "SHELTER"
          ? { create: { shelterName: shelterName.trim() } }
          : undefined
    },
    select: { id: true, name: true, email: true, role: true }
  });

  const token = signAccessToken({ sub: user.id, role: user.role });
  res.status(201).json({ user, token });
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRouter.post("/login", async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signAccessToken({ sub: user.id, role: user.role });

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const userId = req.user.sub;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
});