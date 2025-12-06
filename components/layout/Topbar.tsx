"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";

export default function Topbar() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="flex h-14 items-center justify-between border-b px-4">
      <div className="text-sm text-muted-foreground">
        {user ? (
          <span>
            Conectado como{" "}
            <span className="font-medium text-foreground">{user.name}</span>
            <span className="ml-2 rounded border px-2 py-0.5 text-xs uppercase text-muted-foreground">
              {user.role}
            </span>
          </span>
        ) : (
          <span>Visitante</span>
        )}
      </div>
      {user && (
        <Button size="sm" variant="outline" onClick={logout} disabled={loading}>
          {loading ? "Saliendo..." : "Cerrar sesión"}
        </Button>
      )}
    </div>
  );
}
