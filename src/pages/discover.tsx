import { Button, Center, Grid, Group, Loader } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { Activity, EmptyData, PageTitle } from "@/components";
import { useAuth } from "@/hooks";
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
  const [activities, setActivities] = useState<ActivityDto[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (!cursor) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/activities?cursor=${cursor}`);
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
        <title>Discover | CDTR</title>
      </Head>
      <Group justify="space-between">
        <PageTitle title="Découvrez des activités" />
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
      {loading && !cursor && (
        <Center mt="md">
          <Loader size="sm" />
        </Center>
      )}
    </>
  );
}
