import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = Router();
console.log("dogs router loaded");
/**
 * GET /dogs
 * Public list (default excludes archived)
 * Supports filters
 */
router.get("/", async (req, res) => {
  try {
    const {
      breed,
      ageCategory,
      sizeCategory,
      q,
      vaccinated,
      neutered,
      microchipped,
      goodWithKids,
      goodWithDogs,
      houseTrained,
      maxFee,
    } = req.query;

    const where = { archived: false };

    if (breed) where.breed = { contains: String(breed), mode: "insensitive" };
    if (ageCategory) where.ageCategory = String(ageCategory);
    if (sizeCategory) where.sizeCategory = String(sizeCategory);

    if (vaccinated === "true") where.vaccinated = true;
    if (neutered === "true") where.neutered = true;
    if (microchipped === "true") where.microchipped = true;
    if (goodWithKids === "true") where.goodWithKids = true;
    if (goodWithDogs === "true") where.goodWithDogs = true;
    if (houseTrained === "true") where.houseTrained = true;

    if (maxFee) {
      where.adoptionFee = { lte: Number(maxFee) };
    }

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
 * Shelter only
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
    const {
      name,
      breed,
      description,
      ageCategory,
      sizeCategory,
      imageUrl,
      vaccinated,
      neutered,
      microchipped,
      goodWithKids,
      goodWithDogs,
      houseTrained,
      adoptionFee,
    } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!breed || typeof breed !== "string") {
      return res.status(400).json({ error: "Breed is required." });
    }
    if (!ageCategory) {
      return res.status(400).json({ error: "ageCategory is required." });
    }
    if (!sizeCategory) {
      return res.status(400).json({ error: "sizeCategory is required." });
    }

    const dog = await prisma.dog.create({
      data: {
        name: name.trim(),
        breed: breed.trim(),
        description: description ? String(description) : null,
        ageCategory,
        sizeCategory,
        imageUrl: imageUrl ? String(imageUrl) : null,
        vaccinated: Boolean(vaccinated),
        neutered: Boolean(neutered),
        microchipped: Boolean(microchipped),
        goodWithKids: Boolean(goodWithKids),
        goodWithDogs: Boolean(goodWithDogs),
        houseTrained: Boolean(houseTrained),
        adoptionFee: adoptionFee !== undefined && adoptionFee !== null && adoptionFee !== ""
          ? Number(adoptionFee)
          : null,
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
 * Shelter only
 */
router.patch("/:id", requireAuth, requireRole("SHELTER"), async (req, res) => {
  try {
    const id = req.params.id;

    const existing = await prisma.dog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Dog not found." });
    if (existing.shelterId !== req.user.id) return res.status(403).json({ error: "Not allowed." });

    const {
      name,
      breed,
      description,
      ageCategory,
      sizeCategory,
      imageUrl,
      vaccinated,
      neutered,
      microchipped,
      goodWithKids,
      goodWithDogs,
      houseTrained,
      adoptionFee,
      archived,
    } = req.body;

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
        ...(vaccinated !== undefined ? { vaccinated: Boolean(vaccinated) } : {}),
        ...(neutered !== undefined ? { neutered: Boolean(neutered) } : {}),
        ...(microchipped !== undefined ? { microchipped: Boolean(microchipped) } : {}),
        ...(goodWithKids !== undefined ? { goodWithKids: Boolean(goodWithKids) } : {}),
        ...(goodWithDogs !== undefined ? { goodWithDogs: Boolean(goodWithDogs) } : {}),
        ...(houseTrained !== undefined ? { houseTrained: Boolean(houseTrained) } : {}),
        ...(adoptionFee !== undefined
          ? {
              adoptionFee:
                adoptionFee === null || adoptionFee === ""
                  ? null
                  : Number(adoptionFee),
            }
          : {}),
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
 * Shelter only
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


router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "BASIC_USER") {
      return res.status(403).json({ error: "Only basic users can like dogs." });
    }

    const dogId = req.params.id;
    const userId = req.user.id;

    const dog = await prisma.dog.findUnique({ where: { id: dogId } });
    if (!dog) {
      return res.status(404).json({ error: "Dog not found." });
    }

    const existing = await prisma.dogLike.findUnique({
      where: {
        userId_dogId: {
          userId,
          dogId,
        },
      },
    });

    if (existing) {
      return res.json({ liked: true, alreadyLiked: true });
    }

    const like = await prisma.dogLike.create({
      data: {
        userId,
        dogId,
      },
    });

    res.status(201).json({ liked: true, like });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not like dog." });
  }
});
/**
 * GET /dogs/:id
 * Public (non-archived only)
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