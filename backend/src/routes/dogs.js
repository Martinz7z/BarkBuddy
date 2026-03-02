import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

export const dogsRouter = Router();

const createDogSchema = z.object({
  name: z.string().min(2),
  breed: z.string().min(2),
  description: z.string().max(1000).optional(),
  ageCategory: z.enum(["PUPPY", "ADULT", "SENIOR"]),
  sizeCategory: z.enum(["SMALL", "MEDIUM", "LARGE"]),
  // If your schema supports photos as a string[] or a separate table, we’ll add later
});

dogsRouter.post("/", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const { name, breed, description, ageCategory, sizeCategory } = req.body;

    const dog = await prisma.dog.create({
      data: {
        name,
        breed,
        description,
        ageCategory,
        sizeCategory,
        shelter: { connect: { id: req.user.id } },
      },
    });

    res.status(201).json({ dog });
  } catch (err) {
    console.error("POST /dogs error:", err);
    res.status(500).json({ error: "Failed to create dog" });
  }
});