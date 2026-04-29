import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { favoriteService } from "@/server/favorites/favorite.service";

export default withMethods({
  GET: async (req, res) => {
    const user = await requireUser(req);
    const ids = await favoriteService.findIdsByUser(user._id.toString());
    res.status(200).json({ ids });
  },
});
