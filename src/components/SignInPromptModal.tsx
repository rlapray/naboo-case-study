import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import Link from "next/link";

export interface SignInPromptModalProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

export function SignInPromptModal({ opened, onClose }: SignInPromptModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Connectez-vous pour ajouter des favoris"
      closeButtonProps={{ "aria-label": "Fermer" }}
    >
      <Stack>
        <Text size="sm">
          Créez un compte ou connectez-vous pour sauvegarder vos activités
          préférées.
        </Text>
        <Group>
          <Button component={Link} href="/signin">
            Se connecter
          </Button>
          <Button component={Link} href="/signup" variant="light">
            S&apos;inscrire
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
