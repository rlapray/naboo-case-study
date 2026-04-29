import { useRef, useState } from "react";
import type { ActivityDto, PaginatedActivitiesResponse } from "@/types/activity";

interface UseCursorPaginationOptions {
  initial: ActivityDto[];
  initialCursor: string | null;
  fetchPage: (cursor: string) => Promise<PaginatedActivitiesResponse>;
}

export function useCursorPagination({
  initial,
  initialCursor,
  fetchPage,
}: UseCursorPaginationOptions) {
  const [items, setItems] = useState<ActivityDto[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  const loadMore = async () => {
    if (!cursor || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const data = await fetchPage(cursor);
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor ?? null);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const reset = (newItems: ActivityDto[], newCursor: string | null) => {
    setItems(newItems);
    setCursor(newCursor);
  };

  return { items, cursor, loading, loadMore, reset };
}
