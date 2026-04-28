import { withMethods } from "@/server/api";

export default withMethods({
  GET: (_req, res) => {
    res.status(200).json({ status: "ok" });
  },
});
