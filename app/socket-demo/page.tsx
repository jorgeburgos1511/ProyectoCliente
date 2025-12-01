"use client";

import React, { useState, useEffect } from "react";
import RealtimeActivityFeed from "@/components/realtime/RealtimeActivityFeed";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";

export default function SocketDemoPage() {
  const { connected, error, socket } = useSocket();

  type LogEntry = {
    ts: number;
    kind: "info" | "error" | "event";
    event?: string;
    payload?: any;
    message?: string;
  };

  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Log de conexión/desconexión
  useEffect(() => {
    setLogs((prev) => [
      {
        ts: Date.now(),
        kind: "info" as const,
        message: connected ? "socket connected" : "socket disconnected",
      },
      ...prev,
    ].slice(0, 200));
  }, [connected]);

  // Log de errores de conexión
  useEffect(() => {
    if (error) {
      setLogs((prev) => [
        { ts: Date.now(), kind: "error" as const, message: error },
        ...prev,
      ].slice(0, 200));
    }
  }, [error]);

  // Log de cualquier evento entrante del servidor
  useEffect(() => {
    if (!socket) return;
    const handler = (event: string, ...args: any[]) => {
      setLogs((prev) => [
        { ts: Date.now(), kind: "event" as const, event, payload: args?.[0] },
        ...prev,
      ].slice(0, 200));
    };
    socket.onAny(handler);
    return () => {
      socket.offAny(handler);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Socket Demo</h1>
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

      {/* Solo dos secciones: Socket logs y Actividad en tiempo real */}
      <div className="space-y-4">
        {/* Socket logs */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Socket logs</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setLogs([])}>
                Limpiar
              </Button>
            </div>
          </div>
          <div className="p-3">
            {logs.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin logs</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                {logs.map((l, i) => (
                  <li key={i} className="rounded-md border p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {l.kind}
                        {l.event ? ` • ${l.event}` : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(l.ts).toLocaleTimeString()}
                      </span>
                    </div>
                    {l.message && (
                      <div className={l.kind === "error" ? "text-red-600" : "text-muted-foreground"}>
                        {l.message}
                      </div>
                    )}
                    {l.payload !== undefined && (
                      <pre className="mt-1 whitespace-pre-wrap text-muted-foreground">
                        {JSON.stringify(l.payload, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Actividad en tiempo real */}
        <RealtimeActivityFeed />
      </div>
    </div>
  );
}
