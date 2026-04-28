import type { IconUserCircle } from "@tabler/icons-react";

export interface SubRoute {
  link: string;
  label: string;
  requiredAuth?: boolean;
}

export interface Route {
  label: string;
  route: string | SubRoute[];
  icon?: typeof IconUserCircle;
  requiredAuth?: boolean;
}
