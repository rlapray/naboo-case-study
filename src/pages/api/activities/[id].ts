import { z } from "zod";
import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { toActivityDto } from "@/server/serialize";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export default withMethods({
  GET: async (req, res) => {
    const { id } = paramsSchema.parse(req.query);
    const activity = await activityService.findOne(id);
    res.status(200).json(toActivityDto(activity));
  },
});
