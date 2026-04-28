import { Card, Image, Text } from "@mantine/core";
import Link from "next/link";
import classes from "@/utils/global.module.css";

interface CityProps {
  readonly city: string;
}

export function City({ city }: CityProps) {
  return (
    <Link href={`/explorer/${city}`} className={classes.link}>
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{ width: "100%" }}
      >
        <Card.Section>
          <Image
            src="https://dummyimage.com/480x4:3"
            height={160}
            alt="random image of city"
          />
        </Card.Section>
        <Text mt="md" fw="bold">
          {city}
        </Text>
        <Text mt="md" style={{ height: "3rem" }} className={classes.ellipsis}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </Text>
      </Card>
    </Link>
  );
}
