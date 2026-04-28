import type { HydratedDocument, Model } from "mongoose";
import mongoose, { Schema } from "mongoose";

export type UserRole = "user" | "admin";

export interface IUser {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  token?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    token: { type: String },
  },
  { timestamps: true },
);

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ??
  mongoose.model<IUser>("User", userSchema);
