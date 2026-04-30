import { Badge, Flex, Grid, Group, Image, Text } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { FavoriteToggle, PageTitle } from "@/components";
import { DebugCreatedAt } from "@/components/DebugCreatedAt";
import { activityService } from "@/server/activities/activity.service";
import { connectDb } from "@/server/db";
import { NotFoundError } from "@/server/errors";
import { toActivityDto } from "@/server/serialize";
import type { ActivityDto } from "@/types/activity";

interface ActivityDetailsProps {
  readonly activity: ActivityDto;
}

export const getServerSideProps: GetServerSideProps<
  ActivityDetailsProps
> = async ({ params }) => {
  if (!params?.id || Array.isArray(params.id)) return { notFound: true };
  await connectDb();
  try {
    const activity = await activityService.findOne(params.id);
    return { props: { activity: toActivityDto(activity) } };
  } catch (err) {
    if (err instanceof NotFoundError) return { notFound: true };
    throw err;
  }
};

export default function ActivityDetails({ activity }: ActivityDetailsProps) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{`${activity.name} | CDTR`}</title>
      </Head>
      <PageTitle title={activity.name} prevPath={router.back} />
      <Grid>
        <Grid.Col span={7}>
          <Image
            src="https://dummyimage.com/640x4:3"
            radius="md"
            alt="random image of city"
            width="100%"
            height="400"
          />
        </Grid.Col>
        <Grid.Col span={5}>
          <Flex direction="column" gap="md">
            <Group mt="md" mb="xs" justify="space-between">
              <Group gap="xs">
                <Badge color="pink" variant="light">
                  {activity.city}
                </Badge>
                <Badge color="yellow" variant="light">
                  {`${activity.price}€/j`}
                </Badge>
              </Group>
              <FavoriteToggle activityId={activity.id} />
            </Group>
            <Text size="sm">{activity.description}</Text>
            <Text size="sm" c="dimmed">
              Ajouté par {activity.owner.firstName} {activity.owner.lastName}
            </Text>
            <DebugCreatedAt activity={activity} />
          </Flex>
        </Grid.Col>
      </Grid>
    </>
  );
}
