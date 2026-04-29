import type { ComponentType } from "react";
import { withAuth } from "./withAuth";

export const withoutAuth = <P extends object,>(W: ComponentType<P>) =>
  withAuth(W, "guest");
