import type { HydratedDocument, Model, Types } from "mongoose";
import mongoose, { Schema } from "mongoose";

export interface IActivity {
  name: string;
  city: string;
  description: string;
  price: number;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ActivityDocument = HydratedDocument<IActivity>;

const activitySchema = new Schema<IActivity>(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const ActivityModel: Model<IActivity> =
  (mongoose.models.Activity as Model<IActivity> | undefined) ??
  mongoose.model<IActivity>("Activity", activitySchema);
