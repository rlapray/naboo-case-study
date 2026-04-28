export type UserRole = "user" | "admin";

export interface PublicUserDto {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface UserDto extends PublicUserDto {
  email: string;
}
