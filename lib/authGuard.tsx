"use client";

import React from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ProtectedRouteOptions } from "@/lib/roles";
import { canAccess } from "@/lib/roles";
import { useAuth } from "@/components/providers/AuthProvider";

type GuardProps = React.PropsWithChildren<{
  options?: ProtectedRouteOptions;
}>;

export default function AuthGuard({ children, options }: GuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Si no hay usuario autenticado redirigir a login
    if (!user) {
      const returnTo = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?returnTo=${returnTo}`);
      return;
    }

    // Validación de acceso por rol 
    if (!canAccess(user, options)) {
      router.replace("/dashboard");
      return;
    }
  }, [user, loading, options, pathname, router]);

  // Mientras se valida sesión o se redirige
  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
