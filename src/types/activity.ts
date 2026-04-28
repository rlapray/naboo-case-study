import type { PublicUserDto } from "./user";

export interface ActivityDto {
  id: string;
  name: string;
  city: string;
  description: string;
  price: number;
  createdAt: string;
  owner: PublicUserDto;
}

export interface CreateActivityInput {
  name: string;
  city: string;
  description: string;
  price: number;
}

export interface PaginatedActivitiesResponse {
  items: ActivityDto[];
  nextCursor?: string;
}
