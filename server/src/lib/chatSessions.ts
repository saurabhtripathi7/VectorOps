import { ObjectId } from "mongodb";
import { getClientPromise } from "./mongodb";

export type ChatSession = {
  _id: ObjectId;
  title: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
};

function assertValidObjectId(value: string, label: string) {
  if (!ObjectId.isValid(value)) {
    throw new Error(`Invalid ${label}`);
  }
}

export async function getChatSessions() {
  const client = await getClientPromise();
  const db = client.db("vectorops");

  return db.collection<ChatSession>("sessions")
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function createChatSession(title: string = "New Chat") {
  const client = await getClientPromise();
  const db = client.db("vectorops");

  const now = new Date();

  const res = await db.collection("sessions").insertOne({
    title,
    createdAt: now,
    updatedAt: now,
  });

  return {
    _id: res.insertedId,
    title,
  };
}

export async function getChatSessionById(id: string) {
  assertValidObjectId(id, "sessionId");
  const client = await getClientPromise();
  const db = client.db("vectorops");

  return db.collection("sessions").findOne({
    _id: new ObjectId(id),
  });
}

export async function getChatSessionSummary(id: string) {
  const session = await getChatSessionById(id);
  return session?.summary ?? "";
}

export async function updateChatSessionSummary(id: string, summary: string) {
  assertValidObjectId(id, "sessionId");
  const client = await getClientPromise();
  const db = client.db("vectorops");

  await db.collection("sessions").updateOne(
    { _id: new ObjectId(id) },
    { $set: { summary, updatedAt: new Date() } }
  );
}
