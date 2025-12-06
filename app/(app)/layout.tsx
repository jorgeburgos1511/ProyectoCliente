import React from "react";
import AuthGuard from "@/lib/authGuard";
import AppLayout from "@/components/layout/AppLayout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}
