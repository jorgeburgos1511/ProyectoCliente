import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/lib/socket-types";

export type TSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

function resolveSocketUrl(): string {
  const envExplicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (envExplicit) return envExplicit;

  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
  const socketPort = process.env.NEXT_PUBLIC_SOCKET_PORT || "3001";

  // Prefer window.location when on client to preserve hostname
  if (typeof window !== "undefined") {
    try {
      const u = new URL(window.location.origin);
      // If running on default dev port, swap to socket port
      u.port = socketPort;
      return u.origin;
    } catch {
      // Fallback to API-derived origin
    }
  }

  // Derive from API base: remove trailing /api and swap port
  const base = api.replace(/\/api\/?$/, "");
  try {
    const u = new URL(base);
    u.port = socketPort;
    return u.origin;
  } catch {
    return `http://localhost:${socketPort}`;
  }
}

export function createSocket(token: string): TSocket {
  const url = resolveSocketUrl();
  return io(url, {
    auth: { token },
    transports: ["websocket"],
  }) as unknown as TSocket;
}
