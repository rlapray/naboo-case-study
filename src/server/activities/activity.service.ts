import { Types } from "mongoose";
import { NotFoundError } from "../errors";
// Register the User model up-front so .populate("owner") never races on first use.
import "../users/user.schema";
import type { ActivityDocument } from "./activity.schema";
import { ActivityModel } from "./activity.schema";

export interface CreateActivityInput {
  name: string;
  city: string;
  description: string;
  price: number;
}

const DIACRITIC_GROUPS: Record<string, string> = {
  a: "[aàáâãäåæ]",
  c: "[cç]",
  e: "[eèéêë]",
  i: "[iìíîï]",
  n: "[nñ]",
  o: "[oòóôõöø]",
  u: "[uùúûü]",
  y: "[yýÿ]",
};

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/;

function buildDiacriticInsensitiveRegex(input: string): string {
  const stripped = input.normalize("NFD").replace(/[̀-ͯ]/g, "");
  let out = "";
  for (const ch of stripped) {
    const group = DIACRITIC_GROUPS[ch.toLowerCase()];
    if (group) out += group;
    else if (REGEX_SPECIALS.test(ch)) out += "\\" + ch;
    else out += ch;
  }
  return out;
}

export const activityService = {
  async findAll(): Promise<ActivityDocument[]> {
    return ActivityModel.find().sort({ createdAt: -1 }).populate("owner").exec();
  },

  async findLatest(): Promise<ActivityDocument[]> {
    return ActivityModel.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("owner")
      .exec();
  },

  async findByUser(userId: string): Promise<ActivityDocument[]> {
    return ActivityModel.find({ owner: userId })
      .sort({ createdAt: -1 })
      .populate("owner")
      .exec();
  },

  async findOne(id: string): Promise<ActivityDocument> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundError("Activity not found");
    const activity = await ActivityModel.findById(id).populate("owner").exec();
    if (!activity) throw new NotFoundError("Activity not found");
    return activity;
  },

  async create(userId: string, data: CreateActivityInput): Promise<ActivityDocument> {
    const created = await ActivityModel.create({ ...data, owner: userId });
    return created.populate("owner");
  },

  async findCities(): Promise<string[]> {
    return ActivityModel.distinct("city").exec();
  },

  async findByCity(
    city: string,
    activity?: string,
    price?: number,
  ): Promise<ActivityDocument[]> {
    return ActivityModel.find({
      $and: [
        { city },
        ...(price ? [{ price: { $lte: price } }] : []),
        ...(activity
          ? [
              {
                name: {
                  $regex: buildDiacriticInsensitiveRegex(activity),
                  $options: "i",
                },
              },
            ]
          : []),
      ],
    })
      .populate("owner")
      .exec();
  },

  async countDocuments(): Promise<number> {
    return ActivityModel.estimatedDocumentCount().exec();
  },
};
