import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { favoriteService } from "@/server/favorites/favorite.service";
import { toFavoriteDtos } from "@/server/serialize";

export default withMethods({
  GET: async (req, res) => {
    const user = await requireUser(req);
    const docs = await favoriteService.findByUser(user._id.toString());
    res.status(200).json({ items: toFavoriteDtos(docs) });
  },
});
