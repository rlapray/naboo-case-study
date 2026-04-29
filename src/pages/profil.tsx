import {
  Avatar,
  Badge,
  Card,
  Flex,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { FavoriteToggle, PageTitle } from "@/components";
import { useAuth } from "@/hooks";
import { getCurrentUser } from "@/server/auth/session";
import { connectDb } from "@/server/db";
import { favoriteService } from "@/server/favorites/favorite.service";
import { toFavoriteDtos } from "@/server/serialize";
import type { FavoriteDto } from "@/types/favorite";

interface ProfileProps {
  readonly initialFavorites: FavoriteDto[];
}

function FavoriteListEntry({ favorite }: { readonly favorite: FavoriteDto }) {
  const { activity } = favorite;
  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" align="center">
        <Group gap="sm">
          <Link href={`/activities/${activity.id}`}>{activity.name}</Link>
          <Badge color="pink" variant="light">
            {activity.city}
          </Badge>
          <Badge color="yellow" variant="light">
            {`${activity.price}€/j`}
          </Badge>
        </Group>
        <FavoriteToggle activityId={activity.id} />
      </Group>
    </Card>
  );
}

export const Profile = ({ initialFavorites }: ProfileProps) => {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Mon profil | CDTR</title>
      </Head>
      <PageTitle title="Mon profil" />
      <Flex align="center" gap="md">
        <Avatar color="cyan" radius="xl" size="lg">
          {user?.firstName[0]}
          {user?.lastName[0]}
        </Avatar>
        <Flex direction="column">
          <Text>{user?.email}</Text>
          <Text>{user?.firstName}</Text>
          <Text>{user?.lastName}</Text>
        </Flex>
      </Flex>

      <Text fw={700} size="lg" mt="xl" mb="sm">
        Mes favoris
      </Text>
      {initialFavorites.length === 0 ? (
        <Text c="dimmed">Vous n&apos;avez pas encore de favoris.</Text>
      ) : (
        <Stack gap="sm">
          {initialFavorites.map((fav) => (
            <FavoriteListEntry key={fav.id} favorite={fav} />
          ))}
        </Stack>
      )}
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ProfileProps> = async ({
  req,
}) => {
  await connectDb();
  const user = await getCurrentUser(req);
  if (!user) {
    return { redirect: { destination: "/signin", permanent: false } };
  }
  const favorites = await favoriteService.findByUser(user._id.toString());
  const initialFavorites = toFavoriteDtos(favorites);
  return { props: { initialFavorites } };
};

export default Profile;
