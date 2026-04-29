import type { GetServerSideProps } from "next";
import { ActivityListPage } from "@/components";
import { useAuth, useCursorPagination } from "@/hooks";
import { activityService } from "@/server/activities/activity.service";
import { connectDb } from "@/server/db";
import { toActivityDtos } from "@/server/serialize";
import type { ActivityDto, PaginatedActivitiesResponse } from "@/types/activity";

interface DiscoverProps {
  readonly activities: ActivityDto[];
  readonly nextCursor: string | null;
}

export const getServerSideProps: GetServerSideProps<DiscoverProps> = async () => {
  await connectDb();
  const { items, nextCursor } = await activityService.findAll();
  return {
    props: { activities: toActivityDtos(items), nextCursor: nextCursor ?? null },
  };
};

export default function Discover({ activities: initial, nextCursor: initialCursor }: DiscoverProps) {
  const { user } = useAuth();
  const { items: activities, cursor, loading, loadMore } = useCursorPagination({
    initial,
    initialCursor,
    fetchPage: async (c) => {
      const res = await fetch(`/api/activities?cursor=${c}`);
      return res.json() as Promise<PaginatedActivitiesResponse>;
    },
  });

  return (
    <ActivityListPage
      headTitle="Discover | CDTR"
      title="Découvrez des activités"
      activities={activities}
      cursor={cursor}
      loading={loading}
      loadMore={loadMore}
      showCreateButton={!!user}
    />
  );
}
