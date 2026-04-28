import "@mantine/core/styles.css";

import { Container, createTheme, MantineProvider } from "@mantine/core";
import type { AppProps } from "next/app";
import { Topbar } from "@/components";
import { AuthProvider, SnackbarProvider } from "@/contexts";
import { routes } from "@/routes";

const theme = createTheme({
  primaryColor: "teal",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
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
