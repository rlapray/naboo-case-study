import { z } from "zod";
import { withMethods } from "@/server/api";
import { authService } from "@/server/auth/auth.service";
import { toUserDto } from "@/server/serialize";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export default withMethods({
  POST: async (req, res) => {
    const input = bodySchema.parse(req.body);
    const user = await authService.signUp(input);
    res.status(201).json(toUserDto(user));
  },
});
