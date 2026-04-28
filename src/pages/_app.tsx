import { Container, MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";
import { Topbar } from "@/components";
import { AuthProvider, SnackbarProvider } from "@/contexts";
import { routes } from "@/routes";
import { mantineTheme } from "@/utils";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS theme={mantineTheme}>
      <SnackbarProvider>
        <AuthProvider>
          <Topbar routes={routes} />
          <Container>
            <Component {...pageProps} />
          </Container>
        </AuthProvider>
      </SnackbarProvider>
    </MantineProvider>
  );
}
