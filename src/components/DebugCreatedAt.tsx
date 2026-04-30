import { Text } from "@mantine/core";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import type { ActivityDto } from "@/types/activity";

interface DebugCreatedAtProps {
  readonly activity: Pick<ActivityDto, "createdAt">;
}

function formatDateTimeFr(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DebugCreatedAt({ activity }: DebugCreatedAtProps) {
  const { user } = useContext(AuthContext);

  if (user?.role !== "admin") {
    return null;
  }

  return (
    <Text size="xs" c="dimmed">
      {formatDateTimeFr(activity.createdAt)}
    </Text>
  );
}
