import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const conversationsRouter = Router();

conversationsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { shelterId: req.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        shelter: {
          select: {
            id: true,
            name: true,
            email: true,
            shelterProfile: { select: { shelterName: true } },
          },
        },
        dog: {
          select: { id: true, name: true, breed: true, imageUrl: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, text: true, createdAt: true, senderId: true },
        },
      },
    });

    res.json({ conversations });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load conversations." });
  }
});

conversationsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { shelterId, userId, dogId } = req.body;

    let finalUserId = userId;
    let finalShelterId = shelterId;

    if (req.user.role === "BASIC_USER") {
      finalUserId = req.user.id;
      if (!finalShelterId) {
        return res.status(400).json({ error: "shelterId is required." });
      }
    } else if (req.user.role === "SHELTER") {
      finalShelterId = req.user.id;
      if (!finalUserId) {
        return res.status(400).json({ error: "userId is required." });
      }
    } else {
      return res.status(403).json({ error: "Invalid role." });
    }

    const shelterUser = await prisma.user.findUnique({
      where: { id: finalShelterId },
      select: { id: true, role: true },
    });

    const basicUser = await prisma.user.findUnique({
      where: { id: finalUserId },
      select: { id: true, role: true },
    });

    if (!shelterUser || shelterUser.role !== "SHELTER") {
      return res.status(400).json({ error: "Invalid shelterId." });
    }

    if (!basicUser || basicUser.role !== "BASIC_USER") {
      return res.status(400).json({ error: "Invalid userId." });
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: finalUserId,
        shelterId: finalShelterId,
        dogId: dogId || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        shelter: {
          select: {
            id: true,
            name: true,
            email: true,
            shelterProfile: { select: { shelterName: true } },
          },
        },
        dog: {
          select: { id: true, name: true, breed: true, imageUrl: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, text: true, createdAt: true, senderId: true },
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId: finalUserId,
          shelterId: finalShelterId,
          dogId: dogId || null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          shelter: {
            select: {
              id: true,
              name: true,
              email: true,
              shelterProfile: { select: { shelterName: true } },
            },
          },
          dog: {
            select: { id: true, name: true, breed: true, imageUrl: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, text: true, createdAt: true, senderId: true },
          },
        },
      });
    }

    res.status(201).json({ conversation });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not create conversation." });
  }
});