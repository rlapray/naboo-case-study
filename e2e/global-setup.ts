import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../src/server/db";
import { seed } from "../src/server/seed/seed";

async function globalSetup(): Promise<void> {
  loadEnv({ path: ".env.local" });
  loadEnv({ path: ".env" });
  // Isolate e2e from the dev DB: tests write data, so sharing `naboo` with
  // dev would (a) wipe local dev work on reset and (b) accumulate test-created
  // activities across runs, which now matters since listings paginate.
  process.env.MONGO_URI = "mongodb://localhost:27017/naboo_e2e";
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "e2e_jwt_secret";
  }
  if (!process.env.JWT_EXPIRATION_TIME) {
    process.env.JWT_EXPIRATION_TIME = "86400";
  }
  await connectDb();
  await mongoose.connection.dropDatabase();
  await disconnectDb();
  await seed();
  await disconnectDb();
}

export default globalSetup;
