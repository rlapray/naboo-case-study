import { activityService } from "@/server/activities/activity.service";
import { withMethods } from "@/server/api";

export default withMethods({
  GET: async (_req, res) => {
    const cities = await activityService.findCities();
    res.status(200).json(cities);
  },
});
