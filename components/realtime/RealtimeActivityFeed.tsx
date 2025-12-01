"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";

type ActivityItem = {
  userId: string;
  msg: string;
  ts: number;
};

export default function RealtimeActivityFeed() {
  const { connected, onEvent, emit } = useSocket();
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Suscribirse a eventos del servidor
    const off = onEvent("activity:new", (evt) => {
      setItems((prev) => [evt, ...prev].slice(0, 50));
    });
    return () => {
      // Desuscribir
      off && off();
    };
  }, [onEvent]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Actividad en tiempo real</h3>
        <div
          className={`flex items-center gap-2 text-sm ${
            connected ? "text-green-600" : "text-muted-foreground"
          }`}
          title={connected ? "Conectado" : "Desconectado"}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {connected ? "Conectado" : "Sin conexión"}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => emit("activity:post", "Hola en tiempo real")}
          >
            Publicar mensaje
          </Button>
        </div>

        <ul className="space-y-2">
          {items.length === 0 && (
            <li className="text-sm text-muted-foreground">
              No hay actividad reciente.
            </li>
          )}
          {items.map((e, i) => (
            <li
              key={`${e.ts}-${i}`}
              className="rounded-md border p-2 text-sm"
            >
              <div className="font-medium">Usuario: {e.userId}</div>
              <div className="text-muted-foreground">{e.msg}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(e.ts).toLocaleTimeString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
