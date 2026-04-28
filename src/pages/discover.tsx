import { Button, Grid, Group } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { Activity, EmptyData, PageTitle } from "@/components";
import { useAuth } from "@/hooks";
import { activityService } from "@/server/activities/activity.service";
import { connectDb } from "@/server/db";
import { toActivityDtos } from "@/server/serialize";
import type { ActivityDto } from "@/types/activity";

interface DiscoverProps {
  activities: ActivityDto[];
}

export const getServerSideProps: GetServerSideProps<
  DiscoverProps
> = async () => {
  await connectDb();
  const activities = await activityService.findAll();
  return { props: { activities: toActivityDtos(activities) } };
};

export default function Discover({ activities }: DiscoverProps) {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Discover | CDTR</title>
      </Head>
      <Group position="apart">
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
    </>
  );
}
