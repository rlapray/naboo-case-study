import type { Types } from "mongoose";
import type { ActivityDto } from "@/types/activity";
import type { PublicUserDto, UserDto } from "@/types/user";
import type { ActivityDocument } from "./activities/activity.schema";
import type { IUser, UserDocument } from "./users/user.schema";

type AnyUser = UserDocument | (IUser & { _id: Types.ObjectId });

interface PopulatedActivity extends Omit<ActivityDocument, "owner"> {
  owner: AnyUser;
}

export function toPublicUserDto(user: AnyUser): PublicUserDto {
  return {
    id: user._id.toString(),
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export function toUserDto(user: AnyUser): UserDto {
  return { ...toPublicUserDto(user), email: user.email };
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
    owner: toPublicUserDto(populated.owner),
  };
}

export function toActivityDtos(activities: ActivityDocument[]): ActivityDto[] {
  return activities.map(toActivityDto);
}
