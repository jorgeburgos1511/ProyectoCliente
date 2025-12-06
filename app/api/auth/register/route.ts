import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { signUserToken } from "@/lib/jwt";

export async function POST(req: Request) {
  await connectDB();

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Faltan datos para el registro" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { message: "Ya existe un usuario con ese correo" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    // Asignación de rol por defecto y allowlist opcional de dominios para "manager"
    let assignedRole: "admin" | "manager" | "developer" = "developer";
    try {
      const allowlist = (process.env.ALLOWLIST_MANAGER_DOMAINS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const domain = (email.split("@")[1] || "").toLowerCase();
      if (domain && allowlist.includes(domain)) {
        assignedRole = "manager";
      }
    } catch {}
    const user = await User.create({
      name,
      email,
      password: hashed,
      provider: "credentials",
      role: assignedRole,
    });

    const token = signUserToken(user);

    const safeUser = {
      id: (user as any)._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return NextResponse.json({ user: safeUser, token }, { status: 201 });
  } catch (error) {
    console.error("Error en /api/auth/register:", error);
    return NextResponse.json(
      { message: "Error interno al registrar" },
      { status: 500 }
    );
  }
}
