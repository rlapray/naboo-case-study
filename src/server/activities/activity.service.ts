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

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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

function buildPage(
  docs: ActivityDocument[],
  limit: number,
): PaginatedResult<ActivityDocument> {
  const hasMore = docs.length > limit;
  if (hasMore) docs.pop();
  return {
    items: docs,
    nextCursor: hasMore ? docs[docs.length - 1]._id.toString() : undefined,
  };
}

export const activityService = {
  async findAll(
    opts: PaginationOptions = {},
  ): Promise<PaginatedResult<ActivityDocument>> {
    const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const filter = opts.cursor
      ? { _id: { $lt: new Types.ObjectId(opts.cursor) } }
      : {};
    const docs = await ActivityModel.find(filter)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("owner")
      .exec();
    return buildPage(docs, limit);
  },

  async findLatest(): Promise<ActivityDocument[]> {
    return ActivityModel.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("owner")
      .exec();
  },

  async findByUser(
    userId: string,
    opts: PaginationOptions = {},
  ): Promise<PaginatedResult<ActivityDocument>> {
    const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const cursorCondition = opts.cursor
      ? [{ _id: { $lt: new Types.ObjectId(opts.cursor) } }]
      : [];
    const docs = await ActivityModel.find({
      $and: [{ owner: userId }, ...cursorCondition],
    })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("owner")
      .exec();
    return buildPage(docs, limit);
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
    opts: PaginationOptions = {},
  ): Promise<PaginatedResult<ActivityDocument>> {
    const limit = Math.min(opts.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
    const cursorCondition = opts.cursor
      ? [{ _id: { $lt: new Types.ObjectId(opts.cursor) } }]
      : [];
    const docs = await ActivityModel.find({
      $and: [
        { city },
        ...cursorCondition,
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
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("owner")
      .exec();
    return buildPage(docs, limit);
  },

  async countDocuments(): Promise<number> {
    return ActivityModel.estimatedDocumentCount().exec();
  },
};
