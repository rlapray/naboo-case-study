import { z } from "zod";
import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { toActivityDto, toActivityDtos } from "@/server/serialize";

const createSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().min(1),
});

export default withMethods({
  GET: async (_req, res) => {
    const activities = await activityService.findAll();
    res.status(200).json(toActivityDtos(activities));
  },
  POST: async (req, res) => {
    const user = await requireUser(req);
    const input = createSchema.parse(req.body);
    const activity = await activityService.create(user._id.toString(), input);
    res.status(201).json(toActivityDto(activity));
  },
});
