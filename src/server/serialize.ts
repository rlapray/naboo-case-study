import type { Types } from "mongoose";
import type { ActivityDto } from "@/types/activity";
import type { UserDto } from "@/types/user";
import type { ActivityDocument } from "./activities/activity.schema";
import type { IUser, UserDocument } from "./users/user.schema";

interface PopulatedActivity extends Omit<ActivityDocument, "owner"> {
  owner: UserDocument | (IUser & { _id: Types.ObjectId });
}

export function toUserDto(user: UserDocument | (IUser & { _id: Types.ObjectId })): UserDto {
  return {
    id: user._id.toString(),
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export function toActivityDto(activity: ActivityDocument): ActivityDto {
  const populated = activity as unknown as PopulatedActivity;
  return {
    id: populated._id.toString(),
    name: populated.name,
    city: populated.city,
    description: populated.description,
    price: populated.price,
    createdAt: populated.createdAt.toISOString(),
    owner: toUserDto(populated.owner),
  };
}

export function toActivityDtos(activities: ActivityDocument[]): ActivityDto[] {
  return activities.map(toActivityDto);
}
