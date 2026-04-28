import type { UserRole } from "../users/user.schema";

export const userSeed = {
  email: "user1@test.fr",
  password: "user1",
  firstName: "John",
  lastName: "Doe",
};

export const adminSeed = {
  email: "admin@test.fr",
  password: "admin",
  firstName: "Admin",
  lastName: "Boss",
  role: "admin" as UserRole,
};
