import type {
  ActivityDto,
  CreateActivityInput,
  PaginatedActivitiesResponse,
} from "@/types/activity";
import type { SignInInput, SignInResponse, SignUpInput } from "@/types/auth";
import type { FavoriteDto, FavoriteIdsResponse, FavoritesListResponse } from "@/types/favorite";
import type { UserDto } from "@/types/user";

function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody {
  error?: string;
  details?: unknown;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let body: ErrorBody = {};
    try {
      body = (await res.json()) as ErrorBody;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, body.error ?? res.statusText, body.details);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  login(input: SignInInput): Promise<SignInResponse> {
    return request<SignInResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  register(input: SignUpInput): Promise<UserDto> {
    return request<UserDto>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  logout(): Promise<{ ok: true }> {
    return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
  },

  getMe(): Promise<UserDto> {
    return request<UserDto>("/api/me");
  },

  getActivities(params: { cursor?: string; limit?: number } = {}): Promise<PaginatedActivitiesResponse> {
    return request<PaginatedActivitiesResponse>(withQuery("/api/activities", params));
  },

  getLatestActivities(): Promise<ActivityDto[]> {
    return request<ActivityDto[]>("/api/activities/latest");
  },

  getMyActivities(params: { cursor?: string; limit?: number } = {}): Promise<PaginatedActivitiesResponse> {
    return request<PaginatedActivitiesResponse>(withQuery("/api/activities/mine", params));
  },

  getActivity(id: string): Promise<ActivityDto> {
    return request<ActivityDto>(`/api/activities/${encodeURIComponent(id)}`);
  },

  getActivitiesByCity(params: {
    city: string;
    activity?: string;
    price?: number;
    cursor?: string;
    limit?: number;
  }): Promise<PaginatedActivitiesResponse> {
    return request<PaginatedActivitiesResponse>(withQuery("/api/activities/by-city", params));
  },

  getCities(): Promise<string[]> {
    return request<string[]>("/api/cities");
  },

  createActivity(input: CreateActivityInput): Promise<ActivityDto> {
    return request<ActivityDto>("/api/activities", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getFavoriteIds(): Promise<FavoriteIdsResponse> {
    return request<FavoriteIdsResponse>("/api/me/favorites/ids");
  },

  getFavorites(): Promise<FavoritesListResponse> {
    return request<FavoritesListResponse>("/api/me/favorites");
  },

  addFavorite(activityId: string): Promise<FavoriteDto> {
    return request<FavoriteDto>(`/api/me/favorites/${encodeURIComponent(activityId)}`, {
      method: "POST",
    });
  },

  removeFavorite(activityId: string): Promise<void> {
    return request<void>(`/api/me/favorites/${encodeURIComponent(activityId)}`, {
      method: "DELETE",
    });
  },
};
