import { useRouter } from "next/router";
import { createContext, useEffect, useState } from "react";
import { useSnackbar } from "@/hooks";
import { ApiError, api } from "@/services/api";
import type { SignInInput, SignUpInput } from "@/types/auth";
import type { UserDto } from "@/types/user";

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  favoriteIds: Set<string>;
  handleSignin: (input: SignInInput) => Promise<void>;
  handleSignup: (input: SignUpInput) => Promise<void>;
  handleLogout: () => Promise<void>;
  addFavoriteId: (activityId: string) => Promise<void>;
  removeFavoriteId: (activityId: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  favoriteIds: new Set<string>(),
  handleSignin: () => Promise.resolve(),
  handleSignup: () => Promise.resolve(),
  handleLogout: () => Promise.resolve(),
  addFavoriteId: () => Promise.resolve(),
  removeFavoriteId: () => Promise.resolve(),
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const snackbar = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDto | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const loadFavoriteIds = async () => {
    const { ids } = await api.getFavoriteIds();
    setFavoriteIds(new Set(ids));
  };

  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((me) => {
        if (!cancelled) {
          setUser(me);
          return loadFavoriteIds();
        }
      })
      .catch((err: unknown) => {
        if (!(err instanceof ApiError) || err.status !== 401) {
          console.error(err);
        }
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        // Always flip isLoading: setState on an unmounted component is a
        // no-op in React 18+, but a stale `cancelled = true` from a previous
        // StrictMode cycle can otherwise leave the Loader stuck forever.
        setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSignin = async (input: SignInInput) => {
    try {
      setIsLoading(true);
      const result = await api.login(input);
      setUser(result.user);
      await loadFavoriteIds();
      await router.push("/profil");
    } catch {
      snackbar.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (input: SignUpInput) => {
    try {
      setIsLoading(true);
      await api.register(input);
      await router.push("/signin");
    } catch {
      snackbar.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await api.logout();
      setUser(null);
      setFavoriteIds(new Set());
      await router.push("/");
    } catch {
      snackbar.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const addFavoriteId = async (activityId: string) => {
    const previous = favoriteIds;
    setFavoriteIds(new Set([...previous, activityId]));
    try {
      await api.addFavorite(activityId);
    } catch (err) {
      setFavoriteIds(previous);
      if (err instanceof ApiError && err.status === 400) {
        snackbar.error("Vous avez atteint la limite de 100 favoris.");
      } else {
        snackbar.error("Une erreur est survenue");
      }
    }
  };

  const removeFavoriteId = async (activityId: string) => {
    const previous = favoriteIds;
    setFavoriteIds(new Set([...previous].filter((id) => id !== activityId)));
    try {
      await api.removeFavorite(activityId);
    } catch {
      setFavoriteIds(previous);
      snackbar.error("Une erreur est survenue");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        favoriteIds,
        handleSignin,
        handleSignup,
        handleLogout,
        addFavoriteId,
        removeFavoriteId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
