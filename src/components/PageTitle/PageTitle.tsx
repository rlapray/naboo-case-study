import { ActionIcon, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";

interface PageTitleProps {
  title: string;
  prevPath?: string | (() => void);
}

export function PageTitle({ title, prevPath }: PageTitleProps) {
  if (!prevPath) return <h2>{title}</h2>;

  return (
    <Group mt="md" mb="xs">
      {typeof prevPath === "string" ? (
        <Link href={prevPath}>
          <ActionIcon>
            <IconArrowLeft size="1.125rem" />
          </ActionIcon>
        </Link>
      ) : (
        <ActionIcon onClick={prevPath}>
          <IconArrowLeft size="1.125rem" />
        </ActionIcon>
      )}
      <h2>{title}</h2>
    </Group>
  );
}
