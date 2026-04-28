import { compare } from "bcrypt";
import { BadRequestError, ConflictError } from "../errors";
import type { UserDocument } from "../users/user.schema";
import { userService } from "../users/user.service";
import type { JwtPayload } from "./jwt";
import { signToken } from "./jwt";

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput extends SignInInput {
  firstName: string;
  lastName: string;
}

export interface SignInResult {
  access_token: string;
  user: UserDocument;
}

export const authService = {
  async signIn({ email, password }: SignInInput): Promise<SignInResult> {
    const user = await userService.findByEmail(email);
    if (!user) throw new BadRequestError("Wrong credentials provided");

    const ok = await compare(password, user.password);
    if (!ok) throw new BadRequestError("Wrong credentials provided");

    const payload: JwtPayload = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    const token = signToken(payload);
    await userService.updateToken(user._id.toString(), token);
    return { access_token: token, user };
  },

  async signUp(input: SignUpInput): Promise<UserDocument> {
    const existing = await userService.findByEmail(input.email);
    if (existing) throw new ConflictError("Email already in use");
    return userService.createUser(input);
  },
};
