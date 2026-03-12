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
  // Base routes for prefix matching
  {
    path: "/student",
    allowedRoles: ["student"],
  },
  {
    path: "/teacher",
    allowedRoles: ["teacher", "system_admin"],
  },
  {
    path: "/admin",
    allowedRoles: ["system_admin"],
  },
  {
    path: "/leaderboard",
    allowedRoles: ["student", "teacher", "system_admin"],
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

  // Smart redirect based on role to prevent redirect loops
  if (userRole === "teacher") {
    // If a teacher tries to access /student/* or /admin/*, send them to their dashboard
    if (routePath.startsWith("/student") || routePath.startsWith("/admin")) {
      return "/teacher/dashboard";
    }
    return "/teacher/dashboard";
  } else if (userRole === "system_admin") {
    return "/admin/dashboard";
  } else if (userRole === "student") {
    // If a student tries to access /teacher/* or /admin/*, send them to their dashboard
    if (routePath.startsWith("/teacher") || routePath.startsWith("/admin")) {
      return "/student";
    }
  }

  return route.redirectTo || "/student";
}

/**
 * Helper function to find a route configuration by path
 * Supports prefix-based matching (e.g., /student/settings matches /student)
 * Matches the MOST SPECIFIC route (longest path)
 */
function findRoute(routes: RouteConfig[], path: string): RouteConfig | null {
  let bestMatch: RouteConfig | null = null;

  for (const route of routes) {
    // Exact match is always priority
    if (route.path === path) {
      return route;
    }

    // Prefix match - check if current route path is a prefix of the target path
    // and if it's more specific than what we've found so far
    if (
      path.startsWith(route.path) &&
      (!bestMatch || route.path.length > bestMatch.path.length)
    ) {
      // Ensure prefix match adheres to path boundaries (e.g., /student matches /student/shop but not /student-info)
      const nextChar = path[route.path.length];
      if (!nextChar || nextChar === "/" || nextChar === "?" || nextChar === "#") {
        bestMatch = route;
      }
    }

    // Recursively check children if any
    if (route.children) {
      const found = findRoute(route.children, path);
      if (found && (!bestMatch || found.path.length > bestMatch.path.length)) {
        bestMatch = found;
      }
    }
  }

  return bestMatch;
}

// Helper function to check if a path is a protected route
export function isProtectedRoute(path: string): boolean {
  return findRoute(routeConfig, path) !== null;
}
