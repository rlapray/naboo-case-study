import { z } from "zod";
import { withMethods } from "@/server/api";
import { authService } from "@/server/auth/auth.service";
import { rateLimit } from "@/server/rate-limit";
import { toUserDto } from "@/server/serialize";

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export default withMethods({
  POST: async (req, res) => {
    rateLimit(req, { bucket: "auth:register", max: 5, windowMs: 60_000 });
    const input = bodySchema.parse(req.body);
    const user = await authService.signUp(input);
    res.status(201).json(toUserDto(user));
  },
});
