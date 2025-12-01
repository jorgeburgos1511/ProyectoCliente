"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-3">
      {/* Lado izquierdo: título / logo */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-lg font-semibold">
          TaskFlow
        </Link>
      </div>

      {/* Lado derecho: usuario + avatar + logout */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">
                Rol: {user.role}
              </p>
            </div>

            <Link href="/profile">
              <Image
                src={user.avatarUrl || "/images/default-avatar.png"}
                alt="Avatar"
                width={38}
                height={38}
                className="rounded-full border object-cover cursor-pointer"
              />
            </Link>
          </div>
        )}

        <button
          onClick={logout}
          className="rounded-md bg-black px-3 py-1 text-xs font-medium text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
