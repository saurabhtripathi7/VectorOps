import { Router } from "express";
import { getChatSessions, createChatSession } from "../lib/chatSessions";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const sessions = await getChatSessions();
    res.json(sessions);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { firstMessage } = req.body as { firstMessage?: string };
    const title = firstMessage
      ? firstMessage.length > 30
        ? firstMessage.slice(0, 30) + "..."
        : firstMessage
      : "New Chat";

    const session = await createChatSession(title);
    res.json({ sessionId: session._id });
  } catch (error) {
    console.error("Failed to create session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

export default router;
