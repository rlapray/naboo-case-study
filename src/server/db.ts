import mongoose from "mongoose";

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

if (!globalWithMongoose.__mongoose) {
  globalWithMongoose.__mongoose = cached;
}

export async function connectDb(uri?: string): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  const target = uri ?? process.env.MONGO_URI;
  if (!target) throw new Error("MONGO_URI is not defined");

  if (!cached.promise) {
    cached.promise = mongoose.connect(target, { bufferCommands: false });
  }
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
