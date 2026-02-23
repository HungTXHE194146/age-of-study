import { Profile } from "./supabase";

export interface RouteConfig {
  path: string;
  allowedRoles: Profile["role"][];
  redirectTo?: string;
  children?: RouteConfig[];
}

// Define route configuration with role-based access
export const routeConfig: RouteConfig[] = [
  {
    path: "/",
    allowedRoles: ["system_admin", "teacher", "student"],
  },
  {
    path: "/login",
    allowedRoles: ["system_admin", "teacher", "student"],
  },
  {
    path: "/register",
    allowedRoles: ["system_admin", "teacher", "student"],
  },
  {
    path: "/staff/login",
    allowedRoles: ["system_admin"],
  },
  {
    path: "/student",
    allowedRoles: ["student", "teacher"],
  },
  {
    path: "/student/tests",
    allowedRoles: ["student", "teacher"],
  },
  {
    path: "/student/tests/[testId]",
    allowedRoles: ["student", "teacher"],
  },
  {
    path: "/leaderboard",
    allowedRoles: ["student", "teacher"],
  },
  {
    path: "/settings",
    allowedRoles: ["student", "teacher", "system_admin"],
  },
  {
    path: "/backpack",
    allowedRoles: ["student"],
    redirectTo: "/student",
  },
  {
    path: "/teacher",
    allowedRoles: ["teacher", "system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/teacher/dashboard",
    allowedRoles: ["teacher", "system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/teacher/tests",
    allowedRoles: ["teacher", "system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/teacher/tests/create",
    allowedRoles: ["teacher", "system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/teacher/tests/[testId]",
    allowedRoles: ["teacher", "system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/admin",
    allowedRoles: ["system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/admin/dashboard",
    allowedRoles: ["system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/admin/users",
    allowedRoles: ["system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/admin/classes",
    allowedRoles: ["system_admin"],
    redirectTo: "/student",
  },
  {
    path: "/admin/settings",
    allowedRoles: ["system_admin"],
    redirectTo: "/student",
  },
];

// Helper function to check if a user can access a route
export function canAccessRoute(
  userRole: Profile["role"],
  routePath: string,
): boolean {
  const route = findRoute(routeConfig, routePath);
  if (!route) {
    // If route not found in config, allow access (default behavior)
    return true;
  }

  return route.allowedRoles.includes(userRole);
}

// Helper function to get redirect path for unauthorized access
export function getRedirectPath(
  userRole: Profile["role"],
  routePath: string,
): string | null {
  const route = findRoute(routeConfig, routePath);
  if (!route) {
    return null;
  }

  if (route.allowedRoles.includes(userRole)) {
    return null;
  }

  return route.redirectTo || "/student";
}

// Helper function to find a route configuration by path
function findRoute(routes: RouteConfig[], path: string): RouteConfig | null {
  for (const route of routes) {
    if (route.path === path) {
      return route;
    }
    if (route.children) {
      const found = findRoute(route.children, path);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

// Helper function to check if a path is a protected route
export function isProtectedRoute(path: string): boolean {
  return findRoute(routeConfig, path) !== null;
}
