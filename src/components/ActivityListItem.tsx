import { Box, Button, Flex, Image, Text } from "@mantine/core";
import Link from "next/link";
import type { ActivityDto } from "@/types/activity";
import { useGlobalStyles } from "@/utils";

interface ActivityListItemProps {
  readonly activity: ActivityDto;
}

export function ActivityListItem({ activity }: ActivityListItemProps) {
  const { classes } = useGlobalStyles();

  return (
    <Flex align="center" justify="space-between">
      <Flex gap="md" align="center">
        <Image
          src="https://dummyimage.com/125"
          radius="md"
          alt="random image of city"
          height="125"
          width="125"
        />
        <Box sx={{ maxWidth: "300px" }}>
          <Text className={classes.ellipsis}>{activity.city}</Text>
          <Text className={classes.ellipsis}>{activity.name}</Text>
          <Text className={classes.ellipsis}>{activity.description}</Text>
          <Text
            weight="bold"
            className={classes.ellipsis}
          >{`${activity.price}€/j`}</Text>
        </Box>
      </Flex>
      <Link href={`/activities/${activity.id}`} className={classes.link}>
        <Button variant="outline" color="dark">
          Voir plus
        </Button>
      </Link>
    </Flex>
  );
}
