import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

export function getClientPromise(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please add MONGODB_URI to .env");
  }

  if (clientPromise) {
    return clientPromise;
  }

  if (process.env.NODE_ENV === "development") {
    if (!(global)._mongoClientPromise) {
      client = new MongoClient(uri, options);
      (global)._mongoClientPromise = client.connect();
    }
    clientPromise = (global)._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  return clientPromise;
}


