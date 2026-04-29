import { Button, Center, Grid, Group } from "@mantine/core";
import Head from "next/head";
import Link from "next/link";
import type { ActivityDto } from "@/types/activity";
import { Activity } from "./Activity";
import { EmptyData } from "./EmptyData";
import { PageTitle } from "./PageTitle";

interface ActivityListPageProps {
  readonly headTitle: string;
  readonly title: string;
  readonly activities: ActivityDto[];
  readonly cursor: string | null;
  readonly loading: boolean;
  readonly loadMore: () => Promise<void>;
  readonly showCreateButton?: boolean;
}

export function ActivityListPage({
  headTitle,
  title,
  activities,
  cursor,
  loading,
  loadMore,
  showCreateButton = false,
}: ActivityListPageProps) {
  return (
    <>
      <Head>
        <title>{headTitle}</title>
      </Head>
      <Group justify="space-between">
        <PageTitle title={title} />
        {showCreateButton && (
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
}
