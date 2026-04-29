import { hash } from "bcrypt";
import { NotFoundError } from "../errors";
import type { UserDocument, UserRole } from "./user.schema";
import { UserModel } from "./user.schema";

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export const userService = {
  async findByEmail(email: string): Promise<UserDocument | null> {
    return UserModel.findOne({ email }).exec();
  },

  async getById(id: string): Promise<UserDocument> {
    const user = await UserModel.findById(id).exec();
    // Stryker disable next-line StringLiteral: human-readable error message, not part of API contract
    if (!user) throw new NotFoundError("User not found");
    return user;
  },

  async createUser(data: CreateUserInput): Promise<UserDocument> {
    const hashedPassword = await hash(data.password, 10);
    const user = new UserModel({ ...data, password: hashedPassword });
    return user.save();
  },

  async countDocuments(): Promise<number> {
    return UserModel.countDocuments().exec();
  },
};
