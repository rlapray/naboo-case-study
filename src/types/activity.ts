import type { UserDto } from "./user";

export interface ActivityDto {
  id: string;
  name: string;
  city: string;
  description: string;
  price: number;
  createdAt: string;
  owner: UserDto;
}

export interface CreateActivityInput {
  name: string;
  city: string;
  description: string;
  price: number;
}
