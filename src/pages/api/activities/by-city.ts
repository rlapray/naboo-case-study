import { z } from "zod";
import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { toActivityDtos } from "@/server/serialize";

const querySchema = z.object({
  city: z.string().min(1),
  activity: z.string().optional(),
  price: z.coerce.number().int().min(1).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export default withMethods({
  GET: async (req, res) => {
    const { city, activity, price, cursor, limit } = querySchema.parse(req.query);
    const { items, nextCursor } = await activityService.findByCity(city, activity, price, { cursor, limit });
    res.status(200).json({ items: toActivityDtos(items), nextCursor });
  },
});
