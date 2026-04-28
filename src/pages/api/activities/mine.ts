import { z } from "zod";
import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { toActivityDtos } from "@/server/serialize";

const querySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export default withMethods({
  GET: async (req, res) => {
    const user = await requireUser(req);
    const { cursor, limit } = querySchema.parse(req.query);
    const { items, nextCursor } = await activityService.findByUser(user._id.toString(), { cursor, limit });
    res.status(200).json({ items: toActivityDtos(items), nextCursor });
  },
});
