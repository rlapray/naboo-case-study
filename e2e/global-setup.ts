import { config as loadEnv } from "dotenv";
import { seed } from "../src/server/seed/seed";
import { disconnectDb } from "../src/server/db";

async function globalSetup(): Promise<void> {
  loadEnv({ path: ".env.local" });
  loadEnv({ path: ".env" });
  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI = "mongodb://localhost:27017/naboo";
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "e2e_jwt_secret";
  }
  if (!process.env.JWT_EXPIRATION_TIME) {
    process.env.JWT_EXPIRATION_TIME = "86400";
  }
  await seed();
  await disconnectDb();
}

export default globalSetup;
