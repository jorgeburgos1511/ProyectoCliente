import http from "http";
import { Server } from "socket.io";
import { verifyUserToken } from "@/lib/jwt";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  PresenceUsers,
} from "@/lib/socket-types";

declare global {
  // eslint-disable-next-line no-var
  var __io__: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData> | undefined;
  // eslint-disable-next-line no-var
  var __httpServer__: http.Server | undefined;
  // eslint-disable-next-line no-var
  var __presence__: Map<string, Set<string>> | undefined; // room -> userIds
}

const SOCKET_PORT = Number(process.env.SOCKET_PORT || 3001);

function getCorsOrigin() {
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return process.env.NEXT_PUBLIC_SITE_URL || "*";
}

function ensurePresence() {
  if (!global.__presence__) {
    global.__presence__ = new Map<string, Set<string>>();
  }
  return global.__presence__!;
}

function presenceEmit(
  io: Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>,
  room: string
) {
  const store = ensurePresence();
  const set = store.get(room) || new Set<string>();
  const users: PresenceUsers = Array.from(set).map((id) => ({ id }));
  io.to(room).emit("presence:users", users);
}

export function getIO() {
  if (global.__io__) return global.__io__;

  // Create a dedicated HTTP server (single instance) for Socket.IO
  if (!global.__httpServer__) {
    global.__httpServer__ = http.createServer();
    global.__httpServer__.listen(SOCKET_PORT).on("listening", () => {
      console.log(`[sockets] Listening on :${SOCKET_PORT}`);
    });
    global.__httpServer__.on("error", (err: any) => {
      if (err?.code === "EADDRINUSE") {
        console.warn(`[sockets] Port ${SOCKET_PORT} already in use. Reusing existing server if any.`);
      } else {
        console.error("[sockets] HTTP server error:", err);
      }
    });
  }

  const io = new Server<ClientToServerEvents, ServerToClientEvents, any, SocketData>(
    global.__httpServer__!,
    {
      cors: {
        origin: getCorsOrigin(),
        credentials: true,
      },
      transports: ["websocket", "polling"],
    }
  );

  // Auth middleware using existing JWT
  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth && (socket.handshake.auth as any).token) ||
        (socket.handshake.query && (socket.handshake.query as any).token);
      if (!token) return next(new Error("Unauthorized"));

      const payload = verifyUserToken(String(token));
      socket.data.user = {
        id: payload.sub,
        role: payload.role,
        // name could be attached if added to JWT in the future
      };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;
    console.log("[sockets] Connected:", socket.id, "user:", userId);

    const store = ensurePresence();

    const safeJoin = (room: string) => {
      socket.join(room);
      if (room.startsWith("project:") && userId) {
        if (!store.has(room)) store.set(room, new Set<string>());
        store.get(room)!.add(userId);
        presenceEmit(io, room);
      }
    };

    const safeLeave = (room: string) => {
      socket.leave(room);
      if (room.startsWith("project:") && userId) {
        const set = store.get(room);
        if (set) {
          set.delete(userId);
          if (set.size === 0) store.delete(room);
          presenceEmit(io, room);
        }
      }
    };

    socket.on("join-room", (room) => {
      safeJoin(room);
    });

    socket.on("leave-room", (room) => {
      safeLeave(room);
    });

    // Activity feed
    socket.on("activity:post", (msg) => {
      io.emit("activity:new", {
        userId: userId || "anonymous",
        msg,
        ts: Date.now(),
      });
    });

    // Task events (mock passthrough)
    socket.on("task:create", (evt) => {
      const room = `project:${evt.projectId}`;
      io.to(room).emit("task:created", evt);
    });

    socket.on("task:update", (evt) => {
      const room = `project:${evt.projectId}`;
      io.to(room).emit("task:updated", evt);
    });

    socket.on("task:move", (evt) => {
      const room = `project:${evt.projectId}`;
      io.to(room).emit("task:moved", evt);
    });

    // Presence ping (simple echo with stored users)
    socket.on("presence:ping", ({ projectId }) => {
      const room = `project:${projectId}`;
      presenceEmit(io, room);
    });

    socket.on("disconnect", () => {
      // Remove from any project rooms
      if (userId) {
        for (const room of socket.rooms) {
          if (room.startsWith("project:")) {
            const set = store.get(room);
            if (set) {
              set.delete(userId);
              if (set.size === 0) store.delete(room);
              presenceEmit(io, room);
            }
          }
        }
      }
      console.log("[sockets] Disconnected:", socket.id, "user:", userId);
    });
  });

  global.__io__ = io;
  return io;
}

export const SOCKET_INFO = {
  port: SOCKET_PORT,
};
