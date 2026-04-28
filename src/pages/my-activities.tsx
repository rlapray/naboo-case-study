import { Button, Center, Grid, Group } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Activity, EmptyData, PageTitle } from "@/components";
import { withAuth } from "@/hocs";
import { useAuth } from "@/hooks";
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
  const [activities, setActivities] = useState<ActivityDto[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/activities/mine?cursor=${cursor}`);
      const data: PaginatedActivitiesResponse = await res.json();
      setActivities((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mes activités | CDTR</title>
      </Head>
      <Group justify="space-between">
        <PageTitle title="Mes activités" />
        {user && (
          <Link href="/activities/create">
            <Button>Ajouter une activité</Button>
          </Link>
        )}
      </Group>
      <Grid>
        {activities.length > 0 ? (
          activities.map((activity) => (
            <Activity activity={activity} key={activity.id} />
          ))
        ) : (
          <EmptyData />
        )}
      </Grid>
      {cursor && (
        <Center mt="xl">
          <Button onClick={() => { void loadMore(); }} loading={loading} variant="outline">
            Charger plus
          </Button>
        </Center>
      )}
    </>
  );
};

export default withAuth(MyActivities);
