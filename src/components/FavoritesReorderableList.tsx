import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ActionIcon, Badge, Card, Group } from "@mantine/core";
import { IconGripVertical } from "@tabler/icons-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { FavoriteDto } from "@/types/favorite";
import { FavoriteToggle } from "./FavoriteToggle";

export interface FavoritesReorderableListProps {
  readonly favorites: FavoriteDto[];
  readonly onReorder: (newIds: string[]) => void;
}

export function computeReorderedIds(
  currentIds: string[],
  activeId: string,
  overId: string,
): string[] {
  if (activeId === overId) return currentIds;
  const oldIndex = currentIds.indexOf(activeId);
  const newIndex = currentIds.indexOf(overId);
  if (oldIndex === -1 || newIndex === -1) return currentIds;
  return arrayMove(currentIds, oldIndex, newIndex);
}

interface SortableFavoriteItemProps {
  readonly favorite: FavoriteDto;
}

function SortableFavoriteItem({ favorite }: SortableFavoriteItemProps) {
  const { activity } = favorite;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: favorite.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card withBorder padding="sm" radius="md">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Réordonner ce favori"
              {...attributes}
              {...listeners}
            >
              <IconGripVertical size={18} />
            </ActionIcon>
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
    </div>
  );
}

export function FavoritesReorderableList({
  favorites,
  onReorder,
}: FavoritesReorderableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = favorites.map((f) => f.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newIds = computeReorderedIds(
      ids,
      String(active.id),
      String(over.id),
    );
    onReorder(newIds);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {favorites.map((favorite) => (
          <SortableFavoriteItem key={favorite.id} favorite={favorite} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
