import { Types } from "mongoose";
// Side-effect imports: ensure both User and Activity models are registered so
// .populate({ path: "activityId", populate: "owner" }) cannot race on first use.
import "@/server/users/user.schema";
import { ActivityModel } from "@/server/activities/activity.schema";
import { BadRequestError, ConflictError, NotFoundError } from "@/server/errors";
import type { FavoriteDocument } from "./favorite.schema";
import { FavoriteModel } from "./favorite.schema";

export const FAVORITES_CAP = 100;

const NOT_FOUND_MESSAGE = "Activity not found";

const POPULATE_ACTIVITY_WITH_OWNER = {
  path: "activityId",
  populate: { path: "owner" },
} as const;

async function loadHydrated(
  userId: Types.ObjectId,
  activityId: Types.ObjectId,
): Promise<FavoriteDocument> {
  const doc = await FavoriteModel.findOne({ userId, activityId })
    .populate(POPULATE_ACTIVITY_WITH_OWNER)
    .exec();
  // Should never happen in our flow: we just inserted this favorite.
  if (!doc) throw new NotFoundError("Favorite not found");
  return doc;
}

export const favoriteService = {
  async add(userId: string, activityId: string): Promise<FavoriteDocument> {
    if (!Types.ObjectId.isValid(activityId)) {
      throw new NotFoundError(NOT_FOUND_MESSAGE);
    }
    const activityObjectId = new Types.ObjectId(activityId);
    const userObjectId = new Types.ObjectId(userId);

    const activity = await ActivityModel.findById(activityObjectId).exec();
    if (!activity) throw new NotFoundError(NOT_FOUND_MESSAGE);

    const count = await FavoriteModel.countDocuments({
      userId: userObjectId,
    }).exec();
    if (count >= FAVORITES_CAP) {
      throw new BadRequestError("Favorites limit reached");
    }

    const existing = await FavoriteModel.findOne({
      userId: userObjectId,
      activityId: activityObjectId,
    }).exec();
    if (existing) throw new ConflictError("Favorite already exists");

    await FavoriteModel.updateMany(
      { userId: userObjectId },
      { $inc: { position: 1 } },
    ).exec();

    await FavoriteModel.create({
      userId: userObjectId,
      activityId: activityObjectId,
      position: 0,
    });

    return loadHydrated(userObjectId, activityObjectId);
  },

  async remove(userId: string, activityId: string): Promise<void> {
    if (!Types.ObjectId.isValid(activityId)) return;
    const activityObjectId = new Types.ObjectId(activityId);
    const userObjectId = new Types.ObjectId(userId);

    const favorite = await FavoriteModel.findOne({
      userId: userObjectId,
      activityId: activityObjectId,
    }).exec();
    if (!favorite) return;

    const removedPosition = favorite.position;
    await favorite.deleteOne();
    await FavoriteModel.updateMany(
      { userId: userObjectId, position: { $gt: removedPosition } },
      { $inc: { position: -1 } },
    ).exec();
  },

  async findByUser(userId: string): Promise<FavoriteDocument[]> {
    return FavoriteModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ position: 1 })
      .populate(POPULATE_ACTIVITY_WITH_OWNER)
      .exec();
  },

  async findIdsByUser(userId: string): Promise<string[]> {
    const docs = await FavoriteModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ position: 1 })
      .exec();
    return docs.map((d) => d.activityId.toString());
  },
};
