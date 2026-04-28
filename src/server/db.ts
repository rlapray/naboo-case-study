import mongoose from "mongoose";
import { getEnv } from "./env";

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongoose?: MongooseGlobal;
};

const cached: MongooseGlobal = globalWithMongoose.__mongoose ?? {
  conn: null,
  promise: null,
};

globalWithMongoose.__mongoose ??= cached;

export async function connectDb(uri?: string): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  const target = uri ?? getEnv().MONGO_URI;

  cached.promise ??= mongoose.connect(target, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnectDb(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
