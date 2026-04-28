import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../../db";

let mongod: MongoMemoryServer | null = null;

export async function startTestDb(): Promise<void> {
  if (mongod) return;
  mongod = await MongoMemoryServer.create();
  await connectDb(mongod.getUri());
}

export async function stopTestDb(): Promise<void> {
  await disconnectDb();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

export async function clearTestDb(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
}
