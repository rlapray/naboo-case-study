import { Box, Loader } from "@mantine/core";
import { useRouter } from "next/router";
import type { ComponentType} from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks";

export function withoutAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  // eslint-disable-next-line react/display-name
  return (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && user) {
        void router.push("/");
      }
    }, [isLoading, router, user]);

    if (isLoading)
      return (
        <Box sx={{ textAlign: "center" }}>
          <Loader sx={{ marginTop: "10rem" }} />
        </Box>
      );

    return !isLoading && !user && <WrappedComponent {...props} />;
  };
}
