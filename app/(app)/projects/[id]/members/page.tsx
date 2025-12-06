"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * Página de Miembros deshabilitada.
 * Redirige automáticamente al tablero del proyecto.
 */
export default function ProjectMembersDisabled() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  useEffect(() => {
    const id = (params?.id as string) || "";
    if (id) {
      router.replace(`/projects/${id}/kanban`);
    } else {
      router.replace(`/projects`);
    }
  }, [router, params]);

  return null;
}
