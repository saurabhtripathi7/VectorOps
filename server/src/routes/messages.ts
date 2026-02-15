import { Router } from "express";
import { getMessagesBySession, deleteChatSession } from "../lib/chatMessages";
import { ObjectId } from "mongodb";

const router = Router();

router.get("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }
    const messages = await getMessagesBySession(req.params.id);
    res.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }
    await deleteChatSession(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete chat session:", error);
    res.status(500).json({ error: "Failed to delete chat session" });
  }
});

export default router;
