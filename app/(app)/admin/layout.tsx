import React from "react";
import AuthGuard from "@/lib/authGuard";
import type { Role } from "@/lib/roles";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard options={{ requireRole: "admin" as Role }}>
      {children}
    </AuthGuard>
  );
}
