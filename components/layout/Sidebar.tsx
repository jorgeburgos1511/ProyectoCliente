"use client";

import Link from "next/link";
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
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 font-semibold">
        Menú
      </div>
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
    </div>
  );
}
