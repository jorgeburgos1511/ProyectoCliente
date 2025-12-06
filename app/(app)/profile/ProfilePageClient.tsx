"use client";

import * as React from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ProfilePageClient() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>

      <div className="max-w-xl space-y-4 rounded-lg border bg-card p-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
            {user?.name ?? "-"}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Correo</label>
          <div className="rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">
            {user?.email ?? "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
