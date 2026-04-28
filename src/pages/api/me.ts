import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { toUserDto } from "@/server/serialize";

export default withMethods({
  GET: async (req, res) => {
    const user = await requireUser(req);
    res.status(200).json(toUserDto(user));
  },
});
