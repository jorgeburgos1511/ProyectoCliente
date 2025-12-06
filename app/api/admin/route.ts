import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyUserToken } from "@/lib/jwt";
import { getIO } from "@/lib/socket-server";

async function requireAdmin(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;

  const token = auth.substring("Bearer ".length);
  try {
    const payload = verifyUserToken(token);
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  await connectDB();

  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const users = await User.find().sort({ createdAt: -1 });

  const safeUsers = users.map((u) => ({
    id: (u as any)._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    provider: u.provider,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ users: safeUsers });
}

export async function PUT(req: Request) {
  await connectDB();

  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const { userId, role } = await req.json();

  if (!userId || !role) {
    return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
  }

  const allowedRoles = new Set(["admin", "manager", "developer"]);
  if (!allowedRoles.has(role)) {
    return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
  }

  // Evitar auto-degradarse
  if (String(user._id) === String(admin.sub) && role !== "admin") {
    return NextResponse.json({ message: "No puedes degradar tu propio rol" }, { status: 400 });
  }

  // Evitar dejar al sistema sin administradores
  if (user.role === "admin" && role !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json(
        { message: "Debe existir al menos un administrador en el sistema" },
        { status: 400 }
      );
    }
  }

  user.role = role;
  await user.save();

  // Log de actividad (opcional)
  try {
    const io = getIO();
    io.emit("activity:new", {
      userId: admin.sub,
      msg: `Role changed: ${String(user.email)} → ${String(user.role)}`,
      ts: Date.now(),
    });
  } catch (e) {
    console.error("socket emit error (admin role change):", e);
  }

  return NextResponse.json({
    id: (user as any)._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
