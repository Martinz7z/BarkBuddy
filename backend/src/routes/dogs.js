import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();

/**
 * GET /dogs
 * Public list (default excludes archived)
 * Supports filters: breed, ageCategory, sizeCategory, q
 */
router.get("/", async (req, res) => {
  try {
    const { breed, ageCategory, sizeCategory, q } = req.query;

    const where = { archived: false };

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

    const raw = await prisma.dog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        shelter: {
          select: {
            id: true,
            name: true,
            email: true,
            shelterProfile: { select: { shelterName: true } },
          },
        },
      },
    });

    const dogs = raw.map((d) => ({
      ...d,
      shelterName: d.shelter?.shelterProfile?.shelterName || null,
    }));

    res.json({ dogs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load dogs." });
  }
});

/**
 * GET /dogs/mine
 * Shelter only (includes archived too so you can manage them)
 * IMPORTANT: must be BEFORE "/:id" route
 */
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

/**
 * POST /dogs
 * Shelter only
 */
router.post("/", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const { name, breed, description, ageCategory, sizeCategory, imageUrl } = req.body;

    // basic validation (enough for milestone)
    if (!name || typeof name !== "string") return res.status(400).json({ error: "Name is required." });
    if (!breed || typeof breed !== "string") return res.status(400).json({ error: "Breed is required." });
    if (!ageCategory) return res.status(400).json({ error: "ageCategory is required." });
    if (!sizeCategory) return res.status(400).json({ error: "sizeCategory is required." });

    const dog = await prisma.dog.create({
      data: {
        name: name.trim(),
        breed: breed.trim(),
        description: description ? String(description) : null,
        ageCategory,
        sizeCategory,
        imageUrl: imageUrl ? String(imageUrl) : null,
        shelterId: req.user.id,
      },
    });

    res.status(201).json({ dog });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not create dog." });
  }
});

/**
 * PATCH /dogs/:id
 * Shelter only (can only edit own dog)
 */
router.patch("/:id", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await prisma.dog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Dog not found." });
    if (existing.shelterId !== req.user.id) return res.status(403).json({ error: "Not allowed." });

    const { name, breed, description, ageCategory, sizeCategory, imageUrl, archived } = req.body;

    // prevent un-archiving via this route (keep archive endpoint explicit)
    if (archived !== undefined) {
      return res.status(400).json({ error: "Use /dogs/:id/archive to archive a dog." });
    }

    const dog = await prisma.dog.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(breed !== undefined ? { breed: String(breed).trim() } : {}),
        ...(description !== undefined ? { description: description ? String(description) : null } : {}),
        ...(ageCategory !== undefined ? { ageCategory } : {}),
        ...(sizeCategory !== undefined ? { sizeCategory } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl ? String(imageUrl) : null } : {}),
      },
    });

    res.json({ dog });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not update dog." });
  }
});

/**
 * PATCH /dogs/:id/archive
 * Shelter only (archive own dog)
 */
router.patch("/:id/archive", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await prisma.dog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Dog not found." });
    if (existing.shelterId !== req.user.id) return res.status(403).json({ error: "Not allowed." });

    const dog = await prisma.dog.update({
      where: { id },
      data: { archived: true },
    });

    res.json({ dog });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not archive dog." });
  }
});

/**
 * GET /dogs/:id
 * Public (only returns non-archived dogs)
 * Must be AFTER /mine
 */
router.get("/:id", async (req, res) => {
  try {
    const dog = await prisma.dog.findFirst({
      where: { id: req.params.id, archived: false },
      include: {
        shelter: {
          select: {
            id: true,
            name: true,
            email: true,
            shelterProfile: { select: { shelterName: true } },
          },
        },
      },
    });

    if (!dog) return res.status(404).json({ error: "Dog not found." });

    res.json({
      dog: {
        ...dog,
        shelterName: dog.shelter?.shelterProfile?.shelterName || null,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load dog." });
  }
});

export const dogsRouter = router;