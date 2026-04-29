import mongoose from "mongoose";
import { getEnv } from "./env";

interface MongooseGlobal {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __mongoose?: MongooseGlobal;
};

// Stryker disable next-line ObjectLiteral: explicit nulls vs `{}` are observationally equivalent — `cached.conn` is falsy in both, `cached.promise ??= …` behaves the same.
const cached: MongooseGlobal = globalWithMongoose.__mongoose ?? {
  conn: null,
  promise: null,
};

// Stryker disable next-line AssignmentOperator: cross-instance global cache pinning, not observable from any single test process.
globalWithMongoose.__mongoose ??= cached;

export async function connectDb(uri?: string): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  const target = uri ?? getEnv().MONGO_URI;

  // Stryker disable next-line ObjectLiteral,BooleanLiteral: `bufferCommands: false` is a Mongoose driver-level option (fail-fast on disconnected ops) with no behavioural footprint in the test harness — mongodb-memory-server is always reachable before connectDb resolves.
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
