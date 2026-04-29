import { Types } from "mongoose";
import { ActivityModel } from "@/server/activities/activity.schema";

export const ownerId = new Types.ObjectId();

type ActivitySeed = Partial<{
  name: string;
  city: string;
  price: number;
  description: string;
  owner: Types.ObjectId;
}>;

export function seedActivities(docs: ActivitySeed[]) {
  return ActivityModel.insertMany(
    docs.map((d) => ({
      name: "Activity",
      city: "TestCity",
      description: "desc",
      price: 10,
      owner: ownerId,
      ...d,
    })),
  );
}

export function makeActivities(count: number, overrides: ActivitySeed = {}) {
  return Array.from({ length: count }, (_, i) => ({
    name: `Activity ${i + 1}`,
    city: "TestCity",
    description: "desc",
    price: 10,
    owner: ownerId,
    ...overrides,
  }));
}
