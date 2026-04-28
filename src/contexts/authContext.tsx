import { useRouter } from "next/router";
import { createContext, useEffect, useState } from "react";
import { useSnackbar } from "@/hooks";
import { ApiError, api } from "@/services/api";
import type { SignInInput, SignUpInput } from "@/types/auth";
import type { UserDto } from "@/types/user";

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  handleSignin: (input: SignInInput) => Promise<void>;
  handleSignup: (input: SignUpInput) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  handleSignin: () => Promise.resolve(),
  handleSignup: () => Promise.resolve(),
  handleLogout: () => Promise.resolve(),
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const snackbar = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDto | null>(null);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch((err: unknown) => {
        if (!(err instanceof ApiError) || err.status !== 401) {
          // eslint-disable-next-line no-console
          console.error(err);
        }
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
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
      await router.push("/profil");
    } catch (err) {
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
    } catch (err) {
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
      await router.push("/");
    } catch (err) {
      snackbar.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, handleSignin, handleSignup, handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
