import { activityService } from "../activities/activity.service";
import { connectDb, disconnectDb } from "../db";
import { userService } from "../users/user.service";
import { activitiesSeed } from "./activity.data";
import { adminSeed, userSeed } from "./user.data";

export async function seed(): Promise<void> {
  await connectDb();

  let user = await userService.findByEmail(userSeed.email);
  const userExisted = Boolean(user);
  user ??= await userService.createUser(userSeed);

  const admin = await userService.findByEmail(adminSeed.email);
  if (!admin) {
    await userService.createUser(adminSeed);
  }

  if (!userExisted && user) {
    await Promise.all(
      activitiesSeed.map((activity) =>
        activityService.create(user._id.toString(), activity),
      ),
    );
  }
}

export async function runSeedCli(): Promise<void> {
  try {
    await seed();
    console.log("Seeding successful!");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exitCode = 1;
  } finally {
    await disconnectDb();
  }
}
