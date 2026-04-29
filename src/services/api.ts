import type {
  ActivityDto,
  CreateActivityInput,
  PaginatedActivitiesResponse,
} from "@/types/activity";
import type { SignInInput, SignInResponse, SignUpInput } from "@/types/auth";
import type { UserDto } from "@/types/user";

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
    const search = new URLSearchParams();
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    const qs = search.toString();
    const suffix = qs ? `?${qs}` : "";
    return request<PaginatedActivitiesResponse>(`/api/activities${suffix}`);
  },

  getLatestActivities(): Promise<ActivityDto[]> {
    return request<ActivityDto[]>("/api/activities/latest");
  },

  getMyActivities(params: { cursor?: string; limit?: number } = {}): Promise<PaginatedActivitiesResponse> {
    const search = new URLSearchParams();
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    const qs = search.toString();
    const suffix = qs ? `?${qs}` : "";
    return request<PaginatedActivitiesResponse>(`/api/activities/mine${suffix}`);
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
    const search = new URLSearchParams({ city: params.city });
    if (params.activity) search.set("activity", params.activity);
    if (params.price !== undefined) search.set("price", String(params.price));
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit !== undefined) search.set("limit", String(params.limit));
    return request<PaginatedActivitiesResponse>(`/api/activities/by-city?${search.toString()}`);
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
};
