import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const messagesRouter = Router();

/**
 * GET /messages/:conversationId
 * Load all messages in a conversation if the user belongs to it
 */
messagesRouter.get("/:conversationId", requireAuth, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const isParticipant =
      conversation.userId === req.user.id ||
      conversation.shelterId === req.user.id;

    if (!isParticipant) {
      return res.status(403).json({ error: "Not allowed." });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    res.json({ messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load messages." });
  }
});

/**
 * POST /messages
 * Send a message to an existing conversation OR create one if needed
 *
 * body:
 * {
 *   conversationId?: string,
 *   userId?: string,
 *   shelterId?: string,
 *   dogId?: string,
 *   text: string
 * }
 */
messagesRouter.post("/", requireAuth, async (req, res) => {
  try {
    const { conversationId, userId, shelterId, dogId, text } = req.body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Message text is required." });
    }

    let conversation;

    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found." });
      }

      const isParticipant =
        conversation.userId === req.user.id ||
        conversation.shelterId === req.user.id;

      if (!isParticipant) {
        return res.status(403).json({ error: "Not allowed." });
      }
    } else {
      // create/find conversation automatically
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

      conversation = await prisma.conversation.findFirst({
        where: {
          userId: finalUserId,
          shelterId: finalShelterId,
          dogId: dogId || null,
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId: finalUserId,
            shelterId: finalShelterId,
            dogId: dogId || null,
          },
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        text: text.trim(),
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    res.status(201).json({
      conversationId: conversation.id,
      message,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not send message." });
  }
});