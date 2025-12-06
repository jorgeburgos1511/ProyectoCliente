"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  projectId: string;
};

type TaskEvent =
  | { type: "created"; payload: { id: string; title: string; projectId: string } }
  | { type: "updated"; payload: { id: string; title?: string; projectId: string } }
  | { type: "moved"; payload: { id: string; projectId: string; columnFrom?: string; columnTo?: string } };

export default function TaskEventsDemo({ projectId }: Props) {
  const { connected, joinRoom, leaveRoom, onEvent, emit } = useSocket();
  const room = useMemo(() => `project:${projectId}`, [projectId]);

  const [taskId, setTaskId] = useState<string>(() => Math.random().toString(36).slice(2, 8));
  const [title, setTitle] = useState<string>("Demo task");
  const [from, setFrom] = useState<string>("todo");
  const [to, setTo] = useState<string>("doing");
  const [log, setLog] = useState<TaskEvent[]>([]);

  useEffect(() => {
    if (!projectId) return;
    joinRoom(room);

    const offCreated = onEvent("task:created", (evt) => {
      if (evt.projectId !== projectId) return;
      setLog((prev) => [{ type: "created" as const, payload: evt }, ...prev].slice(0, 50));
    });
    const offUpdated = onEvent("task:updated", (evt) => {
      if (evt.projectId !== projectId) return;
      setLog((prev) => [{ type: "updated" as const, payload: evt }, ...prev].slice(0, 50));
    });
    const offMoved = onEvent("task:moved", (evt) => {
      if (evt.projectId !== projectId) return;
      setLog((prev) => [{ type: "moved" as const, payload: evt }, ...prev].slice(0, 50));
    });

    return () => {
      offCreated && offCreated();
      offUpdated && offUpdated();
      offMoved && offMoved();
      leaveRoom(room);
    };
  }, [projectId, room, joinRoom, leaveRoom, onEvent]);

  const emitCreate = () => {
    emit("task:create", { id: taskId, title, projectId });
  };
  const emitUpdate = () => {
    emit("task:update", { id: taskId, title, projectId });
  };
  const emitMove = () => {
    emit("task:move", { id: taskId, projectId, columnFrom: from, columnTo: to });
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="font-semibold">Task Events (mock)</h3>
        <div
          className={`flex items-center gap-2 text-sm ${
            connected ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          <span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
          {connected ? "Conectado" : "Sin conexión"}
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task ID</label>
            <div className="flex gap-2">
              <Input value={taskId} onChange={(e) => setTaskId(e.target.value)} />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTaskId(Math.random().toString(36).slice(2, 8))}
              >
                Random
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">From (column)</label>
            <Input value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To (column)</label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={emitCreate}>
            Emit task:create
          </Button>
          <Button type="button" variant="secondary" onClick={emitUpdate}>
            Emit task:update
          </Button>
          <Button type="button" variant="outline" onClick={emitMove}>
            Emit task:move
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Últimos eventos</div>
          <ul className="space-y-2 max-h-64 overflow-auto pr-1">
            {log.length === 0 && (
              <li className="text-sm text-muted-foreground">Sin eventos</li>
            )}
            {log.map((e, i) => (
              <li key={i} className="rounded-md border p-2 text-sm">
                <div className="font-medium">task:{e.type}</div>
                <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                  {JSON.stringify(e.payload, null, 2)}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
