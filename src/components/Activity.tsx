import { Badge, Button, Card, Grid, Group, Image, Text } from "@mantine/core";
import Link from "next/link";
import type { ActivityDto } from "@/types/activity";
import classes from "@/utils/global.module.css";
import { FavoriteToggle } from "./FavoriteToggle";

interface ActivityProps {
  readonly activity: ActivityDto;
}

export function Activity({ activity }: ActivityProps) {
  return (
    <Grid.Col span={4}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Card.Section>
          <Image
            src="https://dummyimage.com/480x4:3"
            height={160}
            alt="random image of city"
          />
        </Card.Section>

        <Group justify="space-between" mt="md" mb="xs" wrap="nowrap">
          <Text fw={500} className={classes.ellipsis}>
            {activity.name}
          </Text>
          <FavoriteToggle activityId={activity.id} />
        </Group>

        <Group mt="md" mb="xs">
          <Badge color="pink" variant="light">
            {activity.city}
          </Badge>
          <Badge color="yellow" variant="light">
            {`${activity.price}€/j`}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed" className={classes.ellipsis}>
          {activity.description}
        </Text>

        <Link href={`/activities/${activity.id}`} className={classes.link}>
          <Button variant="light" color="blue" fullWidth mt="md" radius="md">
            Voir plus
          </Button>
        </Link>
      </Card>
    </Grid.Col>
  );
}
