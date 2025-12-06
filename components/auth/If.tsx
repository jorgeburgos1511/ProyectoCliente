"use client";

import { useAuth } from "@/components/providers/AuthProvider";

export function IfAuthenticated({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  return <>{children}</>;
}

export function IfAnonymous({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return null;
  return <>{children}</>;
}

export function IfRole({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (user?.role !== role) return null;
  return <>{children}</>;
}
