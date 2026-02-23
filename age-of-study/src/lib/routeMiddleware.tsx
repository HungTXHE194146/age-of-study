"use client"; // Bắt buộc phải có vì dùng hooks (useRouter, useAuthStore)

import React, { useEffect } from "react";
import { Profile } from "./supabase"; // Đảm bảo đường dẫn import đúng
import {
  canAccessRoute,
  getRedirectPath,
  isProtectedRoute,
} from "./routeConfig";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter, usePathname } from "next/navigation"; // Dùng next/navigation cho App Router

export interface RouteMiddlewareContext {
  user: Profile | null;
  currentPath: string;
  isAuthenticated: boolean;
}

/**
 * Middleware to check route permissions before allowing access
 * Returns null if access is allowed, or a redirect path if access is denied
 */
export function checkRoutePermission(
  context: RouteMiddlewareContext,
): string | null {
  const { user, currentPath, isAuthenticated } = context;

  // If not authenticated, redirect to login (except for auth pages)
  if (!isAuthenticated) {
    if (
      !currentPath.startsWith("/login") &&
      !currentPath.startsWith("/register")
    ) {
      return "/login";
    }
    return null;
  }

  // If authenticated but no user profile, something is wrong
  if (!user) {
    return "/login";
  }

  // Check if this is a protected route that requires permission
  if (isProtectedRoute(currentPath)) {
    const canAccess = canAccessRoute(user.role, currentPath);

    if (!canAccess) {
      // Get the redirect path from route config
      const redirectPath = getRedirectPath(user.role, currentPath);
      return redirectPath || "/student";
    }
  }

  return null; // Access allowed - do not redirect if role is valid
}

/**
 * Higher-order component wrapper for route protection
 * Use this in your page components to automatically handle route protection
 */
export function withRouteProtection<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: Profile["role"][],
): React.ComponentType<P> {
  return function ProtectedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuthStore(); // Giả sử store có trạng thái loading
    const router = useRouter();
    const pathname = usePathname(); // Hook chuẩn để lấy path trong App Router

    // Check permissions
    useEffect(() => {
      // Chỉ check khi đã load xong user để tránh redirect sai
      if (isLoading) return;

      const currentPath = pathname || "/";

      const redirectPath = checkRoutePermission({
        user,
        currentPath,
        isAuthenticated,
      });

      if (redirectPath && redirectPath !== currentPath) {
        router.push(redirectPath);
      }

      // Check specific roles
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push("/student");
      }
    }, [user, isAuthenticated, isLoading, pathname, router]);

    // Trong lúc đang check hoặc redirect, có thể return null hoặc loading spinner
    // Tuy nhiên return Component luôn cũng được để tránh flash content nếu logic xử lý nhanh
    return <Component {...props} />;
  };
}

/**
 * Higher-order component wrapper for route protection with pre-check
 * This version checks permissions before rendering anything, preventing flash of login page
 */
export function withRouteProtectionPreCheck<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: Profile["role"][],
): React.ComponentType<P> {
  return function ProtectedComponent(props: P) {
    const { user, isAuthenticated, isLoading } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    // Pre-check permissions before rendering anything
    useEffect(() => {
      // Nếu đang loading, chờ thêm
      if (isLoading) return;

      const currentPath = pathname || "/";

      // Nếu chưa authenticated, redirect về login
      if (!isAuthenticated) {
        if (
          !currentPath.startsWith("/login") &&
          !currentPath.startsWith("/register")
        ) {
          router.push("/login");
        }
        return;
      }

      // Nếu đã authenticated nhưng không có user profile, something is wrong
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if this is a protected route that requires permission
      if (isProtectedRoute(currentPath)) {
        const canAccess = canAccessRoute(user.role, currentPath);

        if (!canAccess) {
          // Get the redirect path from route config
          const redirectPath = getRedirectPath(user.role, currentPath);
          router.push(redirectPath || "/student");
          return;
        }
      }

      // Check specific roles if provided
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push("/student");
        return;
      }
    }, [user, isAuthenticated, isLoading, pathname, router]);

    // Nếu đang loading hoặc chưa xác định được quyền, không render gì cả
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Nếu chưa authenticated, không render gì cả (để tránh flash login page)
    if (!isAuthenticated || !user) {
      return null;
    }

    // Render component nếu đã pass qua tất cả các kiểm tra
    return <Component {...props} />;
  };
}

/**
 * Simple wrapper component for route protection with pre-check
 * Use this as a wrapper around your page content
 */
export function RouteProtectedWrapper({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Profile["role"][];
}) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Pre-check permissions before rendering anything
  useEffect(() => {
    // Nếu đang loading, chờ thêm
    if (isLoading) return;

    const currentPath = pathname || "/";

    // Nếu chưa authenticated, redirect về login
    if (!isAuthenticated) {
      if (
        !currentPath.startsWith("/login") &&
        !currentPath.startsWith("/register")
      ) {
        router.push("/login");
      }
      return;
    }

    // Nếu đã authenticated nhưng không có user profile, something is wrong
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if this is a protected route that requires permission
    if (isProtectedRoute(currentPath)) {
      const canAccess = canAccessRoute(user.role, currentPath);

      if (!canAccess) {
        // Get the redirect path from route config
        const redirectPath = getRedirectPath(user.role, currentPath);
        router.push(redirectPath || "/student");
        return;
      }
    }

    // Check specific roles if provided
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push("/student");
      return;
    }
  }, [user, isAuthenticated, isLoading, pathname, router]);

  // Nếu đang loading hoặc chưa xác định được quyền, không render gì cả
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Nếu chưa authenticated, không render gì cả (để tránh flash login page)
  if (!isAuthenticated || !user) {
    return null;
  }

  // Render children nếu đã pass qua tất cả các kiểm tra
  return <>{children}</>;
}

/**
 * Hook for checking route permissions in components
 */
export function useRouteProtection() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const checkPermission = (path: string): boolean => {
    const redirectPath = checkRoutePermission({
      user,
      currentPath: path,
      isAuthenticated,
    });

    if (redirectPath) {
      router.push(redirectPath);
      return false;
    }
    return true;
  };

  const canAccess = (path: string): boolean => {
    if (!user) return false;
    return canAccessRoute(user.role, path);
  };

  return {
    checkPermission,
    canAccess,
    user,
    isAuthenticated,
  };
}

/**
 * Hook for checking route permissions without automatic redirect
 * Use this when you want to check permissions but handle redirect manually
 */
export function useRoutePermissionCheck() {
  const { user, isAuthenticated } = useAuthStore();

  const checkPermission = (path: string): string | null => {
    return checkRoutePermission({
      user,
      currentPath: path,
      isAuthenticated,
    });
  };

  const canAccess = (path: string): boolean => {
    if (!user) return false;
    return canAccessRoute(user.role, path);
  };

  return {
    checkPermission,
    canAccess,
    user,
    isAuthenticated,
  };
}
