import { z } from "zod";
import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { toActivityDto, toActivityDtos } from "@/server/serialize";

const getQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const createSchema = z.object({
  name: z.string().min(1).max(120),
  city: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  price: z.number().int().min(1).max(1_000_000),
});

export default withMethods({
  GET: async (req, res) => {
    const { cursor, limit } = getQuerySchema.parse(req.query);
    const { items, nextCursor } = await activityService.findAll({ cursor, limit });
    res.status(200).json({ items: toActivityDtos(items), nextCursor });
  },
  POST: async (req, res) => {
    const user = await requireUser(req);
    const input = createSchema.parse(req.body);
    const activity = await activityService.create(user._id.toString(), input);
    res.status(201).json(toActivityDto(activity));
  },
});
