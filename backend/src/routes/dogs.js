import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.post("/", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const { name, breed, description, ageCategory, sizeCategory } = req.body;

    const dog = await prisma.dog.create({
      data: {
        name,
        breed,
        description,
        ageCategory,
        sizeCategory,
        shelterId: req.user.id,
      },
    });

    res.status(201).json({ dog });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not create dog." });
  }
});

router.get("/mine", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const dogs = await prisma.dog.findMany({
      where: { shelterId: req.user.id },
      orderBy: { createdAt: "desc" }, // if you don't have createdAt, tell me and we'll remove this
    });

    res.json({ dogs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load your dogs." });
  }
});

export const dogsRouter = router;