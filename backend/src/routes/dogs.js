import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { breed, ageCategory, sizeCategory, q } = req.query;

    const where = {};
    if (breed) where.breed = { contains: String(breed), mode: "insensitive" };
    if (ageCategory) where.ageCategory = String(ageCategory);
    if (sizeCategory) where.sizeCategory = String(sizeCategory);

    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: "insensitive" } },
        { breed: { contains: String(q), mode: "insensitive" } },
        { description: { contains: String(q), mode: "insensitive" } },
      ];
    }

    const dogs = await prisma.dog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { shelter: { select: { id: true, name: true, email: true } } },
    });

    res.json({ dogs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load dogs." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const dog = await prisma.dog.findUnique({
      where: { id: req.params.id },
      include: { shelter: { select: { id: true, name: true, email: true } } },
    });

    if (!dog) return res.status(404).json({ error: "Dog not found." });

    res.json({ dog });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load dog." });
  }
});

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
      orderBy: { createdAt: "desc" },
    });

    res.json({ dogs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load your dogs." });
  }
});

router.patch("/:id", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await prisma.dog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Dog not found." });
    if (existing.shelterId !== req.user.id) return res.status(403).json({ error: "Not allowed." });

    const { name, breed, description, ageCategory, sizeCategory } = req.body;

    const dog = await prisma.dog.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(breed !== undefined ? { breed } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(ageCategory !== undefined ? { ageCategory } : {}),
        ...(sizeCategory !== undefined ? { sizeCategory } : {}),
      },
    });

    res.json({ dog });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not update dog." });
  }
});

router.delete("/:id", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await prisma.dog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Dog not found." });
    if (existing.shelterId !== req.user.id) return res.status(403).json({ error: "Not allowed." });

    await prisma.dog.delete({ where: { id } });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not delete dog." });
  }
});

export const dogsRouter = router;