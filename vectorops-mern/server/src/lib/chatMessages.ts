import { getClientPromise } from "./mongodb";
import { ObjectId } from "mongodb";

export type Citation = {
  filePath: string;
  chunkIndex: number;
};

export type ChatMessage = {
  _id: ObjectId;
  sessionId: ObjectId;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  createdAt: Date;
};

function assertValidObjectId(value: string, label: string) {
  if (!ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

export async function saveMessage({
  sessionId,
  role,
  content,
  citations,
}: {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}) {
  try {
    assertValidObjectId(sessionId, "sessionId");
    const client = await getClientPromise();
    const db = client.db("vectorops");

    await db.collection("messages").insertOne({
      sessionId: new ObjectId(sessionId),
      role,
      content,
      citations,
      createdAt: new Date(),
    });

    const updateRes = await db.collection("sessions").updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { updatedAt: new Date() } }
    );

    if (updateRes.matchedCount === 0) {
      console.warn(`[DB] Warning: No session found with ID ${sessionId} to update.`);
    }
  } catch (error) {
    console.error("[DB] Error saving message:", error);
    throw error;
  }
}

export async function getMessagesBySession(sessionId: string) {
  assertValidObjectId(sessionId, "sessionId");
  const client = await getClientPromise();
  const db = client.db("vectorops");

  return db
    .collection<ChatMessage>("messages")
    .find({ sessionId: new ObjectId(sessionId) })
    .sort({ createdAt: 1 })
    .toArray();
}

export async function getRecentMessagesBySession(sessionId: string, limit: number) {
  assertValidObjectId(sessionId, "sessionId");
  const client = await getClientPromise();
  const db = client.db("vectorops");

  const recent = await db
    .collection<ChatMessage>("messages")
    .find({ sessionId: new ObjectId(sessionId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return recent.reverse();
}

export async function countMessagesBySession(sessionId: string) {
  assertValidObjectId(sessionId, "sessionId");
  const client = await getClientPromise();
  const db = client.db("vectorops");

  return db.collection<ChatMessage>("messages").countDocuments({
    sessionId: new ObjectId(sessionId),
  });
}

export async function deleteChatSession(sessionId: string) {
  assertValidObjectId(sessionId, "sessionId");
  const client = await getClientPromise();
  const db = client.db("vectorops");

  await db.collection("messages").deleteMany({
    sessionId: new ObjectId(sessionId),
  });

  await db.collection("sessions").deleteOne({
    _id: new ObjectId(sessionId),
  });
}
