import { z } from "zod";
import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { FAVORITES_CAP, favoriteService } from "@/server/favorites/favorite.service";
import { toFavoriteDtos } from "@/server/serialize";

const reorderSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(FAVORITES_CAP),
});

export default withMethods({
  GET: async (req, res) => {
    const user = await requireUser(req);
    const docs = await favoriteService.findByUser(user._id.toString());
    res.status(200).json({ items: toFavoriteDtos(docs) });
  },
  PATCH: async (req, res) => {
    const user = await requireUser(req);
    const { ids } = reorderSchema.parse(req.body);
    const docs = await favoriteService.reorder(user._id.toString(), ids);
    res.status(200).json({ items: toFavoriteDtos(docs) });
  },
});
