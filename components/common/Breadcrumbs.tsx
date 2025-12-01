"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Crumb = {
  label: string;
  href?: string;
};

export default function Breadcrumbs({ extra }: { extra?: Crumb[] } = {}) {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);

  const crumbs: Crumb[] = [
    { label: "Inicio", href: "/" },
    ...parts.map((segment, idx) => {
      const href = "/" + parts.slice(0, idx + 1).join("/");
      const label = segment.startsWith("[") && segment.endsWith("]")
        ? segment.slice(1, -1)
        : decodeURIComponent(segment);
      return { label, href: idx !== parts.length - 1 ? href : undefined };
    }),
    ...(extra ?? []),
  ];

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      {crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} className="inline-flex items-center gap-2">
          {c.href ? (
            <Link className="hover:underline" href={c.href}>
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground">{c.label}</span>
          )}
          {i < crumbs.length - 1 && <span className="select-none">/</span>}
        </span>
      ))}
    </nav>
  );
}
