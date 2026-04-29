import type { ActivityDto } from "./activity";

export interface FavoriteDto {
  id: string;
  activity: ActivityDto;
  position: number;
  createdAt: string;
}

export interface FavoritesListResponse {
  items: FavoriteDto[];
}

export interface FavoriteIdsResponse {
  ids: string[];
}
