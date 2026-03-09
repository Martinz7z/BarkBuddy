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