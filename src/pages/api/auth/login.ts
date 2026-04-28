import { z } from "zod";
import { withMethods } from "@/server/api";
import { authService } from "@/server/auth/auth.service";
import { setJwtCookie } from "@/server/auth/cookies";
import { getEnv } from "@/server/env";
import { rateLimit } from "@/server/rate-limit";
import { toUserDto } from "@/server/serialize";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export default withMethods({
  POST: async (req, res) => {
    rateLimit(req, { bucket: "auth:login", max: 10, windowMs: 60_000 });
    const input = bodySchema.parse(req.body);
    const result = await authService.signIn(input);
    setJwtCookie(res, result.access_token, getEnv().JWT_EXPIRATION_TIME);
    res.status(200).json({
      access_token: result.access_token,
      user: toUserDto(result.user),
    });
  },
});
