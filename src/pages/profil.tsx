import { Avatar, Flex, Text } from "@mantine/core";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useState } from "react";
import { FavoritesReorderableList, PageTitle } from "@/components";
import { useAuth, useSnackbar } from "@/hooks";
import { getCurrentUser } from "@/server/auth/session";
import { connectDb } from "@/server/db";
import { favoriteService } from "@/server/favorites/favorite.service";
import { toFavoriteDtos } from "@/server/serialize";
import { api } from "@/services/api";
import type { FavoriteDto } from "@/types/favorite";

interface ProfileProps {
  readonly initialFavorites: FavoriteDto[];
}


export const Profile = ({ initialFavorites }: ProfileProps) => {
  const { user } = useAuth();
  const snackbar = useSnackbar();
  const [favorites, setFavorites] = useState<FavoriteDto[]>(initialFavorites);

  const handleReorder = async (newIds: string[]) => {
    const previous = favorites;
    const optimistic = newIds
      .map((id) => favorites.find((f) => f.id === id)!)
      .filter(Boolean);
    setFavorites(optimistic);
    try {
      const { items } = await api.reorderFavorites(newIds);
      setFavorites(items);
    } catch {
      setFavorites(previous);
      snackbar.error("Une erreur est survenue lors du réordonnancement.");
    }
  };

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
      {favorites.length === 0 ? (
        <Text c="dimmed">Vous n&apos;avez pas encore de favoris.</Text>
      ) : (
        <FavoritesReorderableList
          favorites={favorites}
          onReorder={(ids) => void handleReorder(ids)}
        />
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
