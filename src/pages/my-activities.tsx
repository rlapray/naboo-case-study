import { Button, Grid, Group } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { Activity, EmptyData, PageTitle } from "@/components";
import { withAuth } from "@/hocs";
import { useAuth } from "@/hooks";
import { activityService } from "@/server/activities/activity.service";
import { getCurrentUser } from "@/server/auth/session";
import { connectDb } from "@/server/db";
import { toActivityDtos } from "@/server/serialize";
import type { ActivityDto } from "@/types/activity";

interface MyActivitiesProps {
  activities: ActivityDto[];
}

export const getServerSideProps: GetServerSideProps<
  MyActivitiesProps
> = async ({ req }) => {
  await connectDb();
  const user = await getCurrentUser(req);
  if (!user) return { redirect: { destination: "/signin", permanent: false } };
  const activities = await activityService.findByUser(user._id.toString());
  return { props: { activities: toActivityDtos(activities) } };
};

const MyActivities = ({ activities }: MyActivitiesProps) => {
  const { user } = useAuth();

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
    </>
  );
};

export default withAuth(MyActivities);
