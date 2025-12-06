import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { verifyUserToken } from "@/lib/jwt";
import { userListFilterByRequester } from "@/lib/permissions";


export async function GET(req: Request) {
  await connectDB();

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  let requester: { sub: string; email: string; role: "admin" | "manager" | "developer"; iat: number; exp: number };
  try {
    requester = verifyUserToken(auth.slice("Bearer ".length)) as any;
  } catch {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const filterInfo = userListFilterByRequester(requester);
  if (!filterInfo.allowed) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const queryRole = searchParams.get("role");
  const queryDomain = searchParams.get("domain");

  const mongoFilter: Record<string, any> = {};
  // Filtro por rol/dominio para manager (servidor decide)
  if (filterInfo.role) mongoFilter.role = filterInfo.role;
  if (filterInfo.domain) {
    mongoFilter.email = { $regex: new RegExp(`@${filterInfo.domain}$`, "i") };
  }
  // Si es admin, permitir filtros opcionales por rol y dominio desde la query
  if (requester.role === "admin") {
    if (queryRole === "developer") {
      mongoFilter.role = "developer";
    }
    if (queryDomain && queryDomain.trim().length) {
      mongoFilter.email = { $regex: new RegExp(`@${queryDomain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") };
    }
  }

  const docs = await User.find(mongoFilter, { name: 1, email: 1, role: 1 })
    .sort({ createdAt: -1 })
    .lean();

  const users = docs.map((u: any) => ({
    id: u._id.toString(),
    name: u.name as string,
    email: u.email as string,
    role: u.role as "admin" | "manager" | "developer",
  }));

  return NextResponse.json({ users }, { status: 200 });
}
