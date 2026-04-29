import { z } from "zod";
import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { favoriteService } from "@/server/favorites/favorite.service";
import { toFavoriteDto } from "@/server/serialize";

const activityIdSchema = z.object({
  activityId: z.string().regex(/^[a-f\d]{24}$/i),
});

export default withMethods({
  POST: async (req, res) => {
    const user = await requireUser(req);
    const { activityId } = activityIdSchema.parse(req.query);
    const doc = await favoriteService.add(user._id.toString(), activityId);
    res.status(201).json(toFavoriteDto(doc));
  },
  DELETE: async (req, res) => {
    const user = await requireUser(req);
    const { activityId } = activityIdSchema.parse(req.query);
    await favoriteService.remove(user._id.toString(), activityId);
    res.status(204).end();
  },
});
