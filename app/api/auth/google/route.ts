import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { signUserToken } from "@/lib/jwt";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { message: "Falta el código de Google" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Faltan variables de entorno de Google");
      return NextResponse.json(
        { message: "Error de configuración de Google" },
        { status: 500 }
      );
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error("Error al obtener token de Google:", text);
      return NextResponse.json(
        { message: "No se pudo autenticar con Google" },
        { status: 500 }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token as string;

    const profileRes = await fetch(USERINFO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileRes.ok) {
      const text = await profileRes.text();
      console.error("Error al obtener perfil de Google:", text);
      return NextResponse.json(
        { message: "No se pudo obtener el perfil de Google" },
        { status: 500 }
      );
    }

    const profile = await profileRes.json();
    const { sub, email, name, picture } = profile;

    if (!email) {
      return NextResponse.json(
        { message: "Google no devolvió un correo electrónico" },
        { status: 400 }
      );
    }

    await connectDB();

    let user = await User.findOne({ email });

    if (!user) {
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
      user = await User.create({
        name: name ?? email,
        email,
        provider: "google",
        role: assignedRole,
        googleId: sub,
        avatarUrl: picture,
      });
    } else {
      let changed = false;

      if (!user.googleId && sub) {
        user.googleId = sub;
        changed = true;
      }
      if (!user.avatarUrl && picture) {
        user.avatarUrl = picture;
        changed = true;
      }
      if (user.provider !== "google") {
        user.provider = "google";
        changed = true;
      }

      if (changed) {
        await user.save();
      }
    }

    const token = signUserToken(user);

    return NextResponse.json({
      user: {
        id: (user as any)._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        provider: user.provider,
      },
      token,
    });
  } catch (err) {
    console.error("Error en /api/auth/google:", err);
    return NextResponse.json(
      { message: "Error interno en autenticación con Google" },
      { status: 500 }
    );
  }
}
