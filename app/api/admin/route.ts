import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyUserToken } from "@/lib/jwt";

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
    return NextResponse.json(
      { message: "Faltan datos" },
      { status: 400 }
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json(
      { message: "Usuario no encontrado" },
      { status: 404 }
    );
  }

  user.role = role;
  await user.save();

  return NextResponse.json({
    id: (user as any)._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });
}
