import { Flex } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { City, EmptyData, PageTitle } from "@/components";
import { activityService } from "@/server/activities/activity.service";
import { connectDb } from "@/server/db";

interface ExplorerProps {
  readonly cities: readonly string[];
}

export const getServerSideProps: GetServerSideProps<
  ExplorerProps
> = async () => {
  await connectDb();
  const cities = await activityService.findCities();
  return { props: { cities } };
};

export default function Explorer({ cities }: ExplorerProps) {
  return (
    <>
      <Head>
        <title>Explorer | CDTR</title>
      </Head>
      <PageTitle title="Trouvez une activité dans votre ville" />
      <Flex direction="column" gap="1rem">
        {cities.length > 0 ? (
          cities.map((city) => <City city={city} key={city} />)
        ) : (
          <EmptyData />
        )}
      </Flex>
    </>
  );
}
