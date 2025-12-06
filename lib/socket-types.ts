export type SafeUserInfo = {
  id: string;
  role: string;
  name?: string;
};

export type ActivityNew = {
  userId: string;
  msg: string;
  ts: number;
};

export type PresenceUser = {
  id: string;
  name?: string;
};

export type PresenceUsers = PresenceUser[];

export type TaskCreatePayload = {
  id: string;
  title: string;
  projectId: string;
};

export type TaskUpdatePayload = {
  id: string;
  title?: string;
  projectId: string;
};

export type TaskMovePayload = {
  id: string;
  projectId: string;
  columnFrom?: string;
  columnTo?: string;
};

export interface ServerToClientEvents {
  "activity:new": (evt: ActivityNew) => void;
  "task:created": (evt: TaskCreatePayload) => void;
  "task:updated": (evt: TaskUpdatePayload) => void;
  "task:moved": (evt: TaskMovePayload) => void;
  "presence:users": (users: PresenceUsers) => void;
}

export interface ClientToServerEvents {
  // Rooms
  "join-room": (room: string) => void;
  "leave-room": (room: string) => void;

  // Activity
  "activity:post": (msg: string) => void;

  // Tasks (mock demo payloads)
  "task:create": (evt: TaskCreatePayload) => void;
  "task:update": (evt: TaskUpdatePayload) => void;
  "task:move": (evt: TaskMovePayload) => void;

  // Presence
  "presence:ping": (data: { projectId: string }) => void;
}

export interface InterServerEvents {
  // not used for now
}

export interface SocketData {
  user?: SafeUserInfo;
}
