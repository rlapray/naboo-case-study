import type { UserDto } from "./user";

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  firstName: string;
  lastName: string;
}

export interface SignInResponse {
  access_token: string;
  user: UserDto;
}
