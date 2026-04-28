import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";
import { requireUser } from "@/server/auth/session";
import { toActivityDtos } from "@/server/serialize";

export default withMethods({
  GET: async (req, res) => {
    const user = await requireUser(req);
    const activities = await activityService.findByUser(user._id.toString());
    res.status(200).json(toActivityDtos(activities));
  },
});
