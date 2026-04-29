import { ActionIcon } from "@mantine/core";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { SignInPromptModal } from "./SignInPromptModal";

export interface FavoriteToggleProps {
  readonly activityId: string;
}

export function FavoriteToggle({ activityId }: FavoriteToggleProps) {
  const { user, favoriteIds, addFavoriteId, removeFavoriteId } =
    useContext(AuthContext);
  const [modalOpen, setModalOpen] = useState(false);

  const isFavorite = favoriteIds.has(activityId);

  const handleClick = () => {
    if (user === null) {
      setModalOpen(true);
      return;
    }
    if (isFavorite) {
      void removeFavoriteId(activityId);
    } else {
      void addFavoriteId(activityId);
    }
  };

  return (
    <>
      <ActionIcon
        variant="subtle"
        color={isFavorite ? "red" : "gray"}
        aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        onClick={handleClick}
      >
        {isFavorite ? <IconHeartFilled size={20} /> : <IconHeart size={20} />}
      </ActionIcon>
      <SignInPromptModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
