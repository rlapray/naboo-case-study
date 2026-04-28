import { withMethods } from "@/server/api";
import { clearJwtCookie } from "@/server/auth/cookies";

export default withMethods({
  POST: (_req, res) => {
    clearJwtCookie(res);
    res.status(200).json({ ok: true });
  },
});
