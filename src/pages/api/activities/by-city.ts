import { z } from "zod";
import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { toActivityDtos } from "@/server/serialize";

const querySchema = z.object({
  city: z.string().min(1),
  activity: z.string().optional(),
  price: z.coerce.number().int().min(1).optional(),
});

export default withMethods({
  GET: async (req, res) => {
    const { city, activity, price } = querySchema.parse(req.query);
    const activities = await activityService.findByCity(city, activity, price);
    res.status(200).json(toActivityDtos(activities));
  },
});
