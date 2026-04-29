import { MantineProvider, createTheme } from "@mantine/core";
import {
  type RenderOptions,
  type RenderResult,
  render,
} from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { AuthContext } from "@/contexts/authContext";
import { SnackbarContext } from "@/contexts/snackbarContext";
import type { UserDto } from "@/types/user";

type AuthContextValue = {
  user: UserDto | null;
  isLoading: boolean;
  handleSignin: (...args: unknown[]) => Promise<void>;
  handleSignup: (...args: unknown[]) => Promise<void>;
  handleLogout: () => Promise<void>;
};

type SnackbarContextValue = {
  error: (message: string) => void;
  success: (message: string) => void;
};

const noopAsync = () => Promise.resolve();
const noop = () => undefined;

const defaultAuth: AuthContextValue = {
  user: null,
  isLoading: false,
  handleSignin: noopAsync,
  handleSignup: noopAsync,
  handleLogout: noopAsync,
};

const defaultSnackbar: SnackbarContextValue = {
  error: noop,
  success: noop,
};

const theme = createTheme({ primaryColor: "teal" });

export interface RenderWithProvidersOptions extends RenderOptions {
  auth?: Partial<AuthContextValue>;
  snackbar?: Partial<SnackbarContextValue>;
}

export function renderWithProviders(
  ui: ReactElement,
  { auth, snackbar, ...renderOptions }: RenderWithProvidersOptions = {},
): RenderResult & {
  authValue: AuthContextValue;
  snackbarValue: SnackbarContextValue;
} {
  const authValue = { ...defaultAuth, ...auth };
  const snackbarValue = { ...defaultSnackbar, ...snackbar };

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <SnackbarContext.Provider value={snackbarValue}>
        <AuthContext.Provider value={authValue}>
          {children}
        </AuthContext.Provider>
      </SnackbarContext.Provider>
    </MantineProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authValue,
    snackbarValue,
  };
}
