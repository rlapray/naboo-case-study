import { Button, Center, Divider, Flex, Grid } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { Fragment, useEffect, useState } from "react";
import { ActivityListItem, EmptyData, Filters, PageTitle } from "@/components";
import { useCursorPagination, useDebounced } from "@/hooks";
import { activityService } from "@/server/activities/activity.service";
import { connectDb } from "@/server/db";
import { toActivityDtos } from "@/server/serialize";
import type { ActivityDto, PaginatedActivitiesResponse } from "@/types/activity";

interface CityDetailsProps {
  readonly activities: ActivityDto[];
  readonly nextCursor: string | null;
  readonly city: string;
}

export const getServerSideProps: GetServerSideProps<CityDetailsProps> = async ({
  params,
  query,
}) => {
  if (!params?.city || Array.isArray(params.city)) return { notFound: true };

  if (
    (query.activity && Array.isArray(query.activity)) ||
    (query.price && Array.isArray(query.price))
  )
    return { notFound: true };

  await connectDb();
  const { items, nextCursor } = await activityService.findByCity(
    params.city,
    typeof query.activity === "string" ? query.activity : undefined,
    typeof query.price === "string" ? Number(query.price) : undefined,
  );
  return {
    props: {
      activities: toActivityDtos(items),
      nextCursor: nextCursor ?? null,
      city: params.city,
    },
  };
};

export default function ActivityDetails({
  activities: initialActivities,
  nextCursor: initialCursor,
  city,
}: CityDetailsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchActivity, setSearchActivity] = useState<string | undefined>(
    searchParams?.get("activity") ?? undefined
  );
  const debouncedSearchActivity = useDebounced(searchActivity, 300);

  const [searchPrice, setSearchPrice] = useState<number | undefined>(
    searchParams?.get("price") ? Number(searchParams.get("price")) : undefined
  );
  const debouncedSearchPrice = useDebounced(searchPrice, 300);

  const { items: activities, cursor, loading, loadMore, reset } = useCursorPagination({
    initial: initialActivities,
    initialCursor,
    fetchPage: async (c) => {
      const params = new URLSearchParams({ city, cursor: c });
      if (searchActivity) params.set("activity", searchActivity);
      if (searchPrice !== undefined) params.set("price", searchPrice.toString());
      const res = await fetch(`/api/activities/by-city?${params.toString()}`);
      return res.json() as Promise<PaginatedActivitiesResponse>;
    },
  });

  // SSR re-renders deliver a fresh first page after filter navigation.
  const [prevInitial, setPrevInitial] = useState(initialActivities);
  if (prevInitial !== initialActivities) {
    setPrevInitial(initialActivities);
    reset(initialActivities, initialCursor);
  }

  useEffect(() => {
    const searchParams = new URLSearchParams();

    if (debouncedSearchActivity !== undefined)
      searchParams.set("activity", debouncedSearchActivity);

    if (debouncedSearchPrice !== undefined)
      searchParams.set("price", debouncedSearchPrice.toString());

    const stringParams = searchParams.toString();
    const suffix = stringParams ? `?${stringParams}` : "";
    void router.push(`/explorer/${city}${suffix}`);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, debouncedSearchActivity, debouncedSearchPrice]);

  return (
    <>
      <Head>
        <title>{`${city} | CDTR`}</title>
      </Head>
      <PageTitle
        title={`Activités pour la ville de ${city}`}
        prevPath="/explorer"
      />
      <Grid>
        <Grid.Col span={4}>
          <Filters
            {...{
              activity: searchActivity,
              price: searchPrice,
              setSearchActivity,
              setSearchPrice,
            }}
          />
        </Grid.Col>
        <Grid.Col span={8}>
          <Flex direction="column" gap="lg">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <Fragment key={activity.id}>
                  <ActivityListItem activity={activity} />
                  {idx < activities.length - 1 && <Divider my="sm" />}
                </Fragment>
              ))
            ) : (
              <EmptyData />
            )}
            {cursor && (
              <Center mt="md">
                <Button onClick={() => { void loadMore(); }} loading={loading} variant="outline">
                  Charger plus
                </Button>
              </Center>
            )}
          </Flex>
        </Grid.Col>
      </Grid>
    </>
  );
}
