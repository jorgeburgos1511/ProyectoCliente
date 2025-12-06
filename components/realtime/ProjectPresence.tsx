"use client";

import React, { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

type Props = {
  projectId: string;
};

type PresenceUser = {
  id: string;
  name?: string;
};

export default function ProjectPresence({ projectId }: Props) {
  const { connected, joinRoom, leaveRoom, onEvent, emit } = useSocket();
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const room = `project:${projectId}`;
    joinRoom(room);

    // Pedir lista inicial (mock)
    emit("presence:ping", { projectId });

    const off = onEvent("presence:users", (list) => {
      setUsers(list);
    });

    return () => {
      off && off();
      leaveRoom(room);
    };
  }, [projectId, joinRoom, leaveRoom, onEvent, emit]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="font-semibold">Presencia en proyecto</h3>
        <div
          className={`flex items-center gap-2 text-sm ${
            connected ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {connected ? "Conectado" : "Sin conexión"}
        </div>
      </div>

      <div className="p-3">
        {users.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No hay usuarios conectados.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                title={u.id}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>{u.name ?? u.id.slice(0, 6)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
