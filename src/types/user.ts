export type UserRole = "user" | "admin";

export interface UserDto {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
}
