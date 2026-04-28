import { config as loadEnv } from "dotenv";
import { runSeedCli } from "../src/server/seed/seed";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://localhost:27017/naboo";
}

void runSeedCli();
