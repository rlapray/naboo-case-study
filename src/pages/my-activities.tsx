import type { GetServerSideProps } from "next";
import { ActivityListPage } from "@/components";
import { withAuth } from "@/hocs";
import { useAuth, useCursorPagination } from "@/hooks";
import { activityService } from "@/server/activities/activity.service";
import { getCurrentUser } from "@/server/auth/session";
import { connectDb } from "@/server/db";
import { toActivityDtos } from "@/server/serialize";
import type { ActivityDto, PaginatedActivitiesResponse } from "@/types/activity";

interface MyActivitiesProps {
  activities: ActivityDto[];
  nextCursor: string | null;
}

export const getServerSideProps: GetServerSideProps<MyActivitiesProps> = async ({ req }) => {
  await connectDb();
  const user = await getCurrentUser(req);
  if (!user) return { redirect: { destination: "/signin", permanent: false } };
  const { items, nextCursor } = await activityService.findByUser(user._id.toString());
  return {
    props: { activities: toActivityDtos(items), nextCursor: nextCursor ?? null },
  };
};

const MyActivities = ({ activities: initial, nextCursor: initialCursor }: MyActivitiesProps) => {
  const { user } = useAuth();
  const { items: activities, cursor, loading, loadMore } = useCursorPagination({
    initial,
    initialCursor,
    fetchPage: async (c) => {
      const res = await fetch(`/api/activities/mine?cursor=${c}`);
      return res.json() as Promise<PaginatedActivitiesResponse>;
    },
  });

  return (
    <ActivityListPage
      headTitle="Mes activités | CDTR"
      title="Mes activités"
      activities={activities}
      cursor={cursor}
      loading={loading}
      loadMore={loadMore}
      showCreateButton={!!user}
    />
  );
};

export default withAuth(MyActivities);
