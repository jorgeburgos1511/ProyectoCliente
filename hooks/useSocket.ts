"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TSocket } from "@/lib/socket-client";
import { createSocket } from "@/lib/socket-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@/lib/socket-types";
import { getAuthToken } from "@/services/api/auth.service";

type EventKey = keyof ServerToClientEvents;

export function useSocket() {
  const socketRef = useRef<TSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = () => socketRef.current;


  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      get()?.emit(event as any, ...(args as any[]));
    },
    []
  );

  // Subscribe wrapper: returns unsubscribe function
  const onEvent = useCallback(
    <E extends EventKey>(
      event: E,
      handler: ServerToClientEvents[E]
    ): (() => void) => {
      const s = get();
      if (!s) return () => {};
      s.on(event, handler as any);
      return () => {
        s.off(event, handler as any);
      };
    },
    []
  );

  const offEvent = useCallback(
    <E extends EventKey>(event: E, handler: ServerToClientEvents[E]) => {
      get()?.off(event, handler as any);
    },
    []
  );

  const joinRoom = useCallback((room: string) => {
    emit("join-room", room);
  }, [emit]);

  const leaveRoom = useCallback((room: string) => {
    emit("leave-room", room);
  }, [emit]);

  useEffect(() => {
    let canceled = false;

    async function init() {
      try {
        setError(null);

        await fetch("/api/socket", { cache: "no-store" }).catch(() => {});

        const token = getAuthToken();
        if (!token) {
          // No hay token aún (usuario no autenticado)
          return;
        }

        const s = createSocket(token);
        socketRef.current = s;

        s.on("connect", () => {
          if (canceled) return;
          setConnected(true);
          setError(null);
        });

        s.on("connect_error", (err) => {
          if (canceled) return;
          setConnected(false);
          setError(err?.message || "connect_error");
        });

        s.on("disconnect", () => {
          if (canceled) return;
          setConnected(false);
        });
      } catch (e: any) {
        if (!canceled) setError(e?.message || "socket_init_error");
      }
    }

    init();

    // Cleanup al desmontar
    return () => {
      canceled = true;
      const s = socketRef.current;
      if (s) {
        s.removeAllListeners();
        s.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    error,
    emit,
    onEvent,
    offEvent,
    joinRoom,
    leaveRoom,
  };
}
