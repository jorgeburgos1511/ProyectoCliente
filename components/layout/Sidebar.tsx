"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin } from "@/lib/roles";

const baseNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Proyectos" },
  { href: "/my-work", label: "Mi trabajo" },
  { href: "/goals", label: "Metas" },
  { href: "/calendar", label: "Calendario" },
  { href: "/profile", label: "Perfil" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const nav = [...baseNav];
  if (user && isAdmin(user)) {
    nav.push({ href: "/admin/users", label: "Administración/Usuarios" });
  }

  return (
    <div className="flex h-full flex-col border-r bg-card">
      {/* TÍTULO */}
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        Menú
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 space-y-1 p-2">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                active ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* USUARIO (PARTE INFERIOR) */}
      <div className="border-t p-4 flex items-center gap-3">
        <Image
          src={user?.avatarUrl || "/images/default-avatar.png"}
          alt="Avatar"
          width={40}
          height={40}
          className="rounded-full border object-cover"
        />

        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {user?.name || "Usuario"}
          </span>

          <span className="text-xs text-muted-foreground">
            {user?.role || "role"}
          </span>
        </div>
      </div>
    </div>
  );
}
