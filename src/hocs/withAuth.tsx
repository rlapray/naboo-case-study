import { Box, Loader } from "@mantine/core";
import { useRouter } from "next/router";
import type { ComponentType } from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks";

type AuthMode = "authed" | "guest";

export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  mode: AuthMode = "authed",
) {
  // eslint-disable-next-line react/display-name
  return (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    const redirectTo = mode === "authed" ? "/signin" : "/";
    const shouldRedirect = mode === "authed" ? !user : !!user;
    const shouldRender = mode === "authed" ? !!user : !user;

    useEffect(() => {
      if (!isLoading && shouldRedirect) {
        void router.push(redirectTo);
      }
    }, [isLoading, router, shouldRedirect, redirectTo]);

    if (isLoading)
      return (
        <Box style={{ textAlign: "center" }}>
          <Loader style={{ marginTop: "10rem" }} />
        </Box>
      );

    return shouldRender ? <WrappedComponent {...props} /> : null;
  };
}
