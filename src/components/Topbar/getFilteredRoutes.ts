import type { UserDto } from "@/types/user";
import type { Route, SubRoute } from "./types";

export const checkRouteAccess = (
  route: Route | SubRoute,
  user: UserDto | null
) => {
  if (user) {
    if (route.requiredAuth === undefined || route.requiredAuth === true) {
      return true; // Include sub-routes with requiredAuth undefined or true
    }
  } else {
    if (route.requiredAuth === undefined || route.requiredAuth === false) {
      return true; // Include sub-routes with requiredAuth undefined or false
    }
  }
  return false; // Exclude sub-routes that don't match the conditions
};

export const getFilteredRoutes = (
  routes: readonly Route[],
  user: UserDto | null
) => {
  return routes
    .map((route) => {
      if (Array.isArray(route.route)) {
        const filteredSubRoutes = route.route.filter((subRoute) =>
          checkRouteAccess(subRoute, user)
        );
        return { ...route, route: filteredSubRoutes };
      } else {
        return route;
      }
    })
    .filter((route) => checkRouteAccess(route, user));
};
