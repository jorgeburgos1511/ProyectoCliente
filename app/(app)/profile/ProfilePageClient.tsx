"use client";

import * as React from "react";
import Image from "next/image";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export default function ProfilePageClient() {
  const { user, token, refreshUser } = useAuth();

  // Lista de imágenes de /public/images
  const avatars = [
    "/images/avatar1.png",
    "/images/avatar2.png",
    "/images/avatar3.png",
    "/images/avatar4.png",
    "/images/avatar5.png",
    "/images/avatar6.png",
    "/images/avatar7.png",
    "/images/avatar8.png",
    "/images/avatar9.png",
    "/images/avatar10.png",
  ];

  // Estado del avatar seleccionado
  const [selected, setSelected] = React.useState<string | null>(
    user?.avatarUrl || null
  );

  // Guardar avatar
  async function handleSave() {
    if (!selected) return;

    console.log("TOKEN EN CLIENTE:", token); // debug

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: selected }),
      });

      const data = await res.json();
      console.log("RESPUESTA BACKEND:", data);

      if (!res.ok) throw new Error(data.message || "Error al guardar avatar");

      toast.success("Foto de perfil actualizada");

      // refrescar datos globales (topbar + sidebar)
      refreshUser();
    } catch (err) {
      console.error("ERROR GUARDANDO AVATAR:", err);
      toast.destructive("Error al guardar foto");
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>

      <div className="max-w-xl space-y-6 rounded-lg border bg-card p-6">

        {/* Selección de avatar */}
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Seleccionar foto de perfil
          </label>

          <div className="grid grid-cols-5 gap-4">
            {avatars.map((src) => (
              <div
                key={src}
                onClick={() => setSelected(src)}
                className={`cursor-pointer rounded-full border-2 p-1 transition ${
                  selected === src
                    ? "border-blue-500 shadow-md"
                    : "border-transparent"
                }`}
              >
                <Image
                  src={src}
                  width={70}
                  height={70}
                  alt="avatar"
                  className="rounded-full object-cover"
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={!selected} className="mt-3">
            Guardar foto
          </Button>
        </div>

        <hr />

        {/* Info del usuario */}
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
