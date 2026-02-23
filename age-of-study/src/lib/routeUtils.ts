import { Profile } from "./supabase";
import {
  canAccessRoute,
  getRedirectPath,
  isProtectedRoute,
  type RouteConfig,
  routeConfig,
} from "./routeConfig";

/**
 * Utility function to check if a user can access a specific route
 * This can be used in getServerSideProps or API routes for server-side protection
 */
export function checkServerSideRouteAccess(
  userRole: Profile["role"],
  routePath: string,
): {
  canAccess: boolean;
  redirectPath: string | null;
} {
  const canAccess = canAccessRoute(userRole, routePath);
  const redirectPath = canAccess ? null : getRedirectPath(userRole, routePath);

  return {
    canAccess,
    redirectPath,
  };
}

/**
 * Utility function to get all routes that a specific role can access
 */
export function getRoutesForRole(userRole: Profile["role"]): string[] {
  const routes: string[] = [];

  function collectRoutes(config: RouteConfig[]): void {
    for (const route of config) {
      if (route.allowedRoles.includes(userRole)) {
        routes.push(route.path);
      }
      if (route.children) {
        collectRoutes(route.children);
      }
    }
  }

  collectRoutes(routeConfig);
  return routes;
}

/**
 * Utility function to check if a route requires authentication
 */
export function requiresAuth(routePath: string): boolean {
  return isProtectedRoute(routePath);
}

/**
 * Utility function to get the default route for a user role
 */
export function getDefaultRouteForRole(userRole: Profile["role"]): string {
  switch (userRole) {
    case "system_admin":
      return "/admin/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "student":
      return "/student";
    default:
      return "/login";
  }
}

/**
 * Utility function to validate if a redirect path is valid
 */
export function isValidRedirectPath(path: string): boolean {
  // Basic validation to prevent open redirects
  return path.startsWith("/") && !path.includes("..") && !path.includes("//");
}
