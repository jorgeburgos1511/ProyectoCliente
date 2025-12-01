"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { IfAnonymous } from "@/components/auth/If";

const baseNav = [{ href: "/", label: "Inicio" }];

export default function NavbarPublic() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (user) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-black text-white dark:bg-white dark:text-black">
            TF
          </span>
          <span>TaskFlow</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm font-medium">
          {/* Siempre visible: items base */}
          {baseNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded px-3 py-2 hover:bg-muted",
                pathname === item.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}

          {/* Solo cuando NO está logueado */}
          <IfAnonymous>
            <Link
              href="/login"
              className={cn(
                "rounded px-3 py-2 hover:bg-muted",
                pathname === "/login"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Ingresar
            </Link>
            <Link
              href="/register"
              className={cn(
                "rounded px-3 py-2 hover:bg-muted",
                pathname === "/register"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Registro
            </Link>
          </IfAnonymous>
        </nav>
      </div>
    </header>
  );
}
