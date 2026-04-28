import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { toActivityDtos } from "@/server/serialize";

export default withMethods({
  GET: async (_req, res) => {
    const activities = await activityService.findLatest();
    res.status(200).json(toActivityDtos(activities));
  },
});
