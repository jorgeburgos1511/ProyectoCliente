import { getIO } from "@/lib/socket-server";

export async function GET() {
  // Lazy-init Socket.IO server (idempotent via globalThis guards)
  try {
    getIO();
    return new Response("ok", {
      status: 200,
      headers: {
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    console.error("[api/socket] init error", e);
    return new Response("error", { status: 500 });
  }
}
