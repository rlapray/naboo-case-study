import { z } from "zod";
import { withMethods } from "@/server/api";
import { authService } from "@/server/auth/auth.service";
import { setJwtCookie } from "@/server/auth/cookies";
import { toUserDto } from "@/server/serialize";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default withMethods({
  POST: async (req, res) => {
    const input = bodySchema.parse(req.body);
    const result = await authService.signIn(input);
    const expiresIn = Number(process.env.JWT_EXPIRATION_TIME ?? "86400");
    setJwtCookie(res, result.access_token, expiresIn);
    res.status(200).json({
      access_token: result.access_token,
      user: toUserDto(result.user),
    });
  },
});
