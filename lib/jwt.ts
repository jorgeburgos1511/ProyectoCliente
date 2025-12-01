import jwt from "jsonwebtoken";
import type { IUser } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!JWT_SECRET) {
  throw new Error("Falta JWT_SECRET en variables de entorno");
}

export function signUserToken(user: IUser): string {
  const payload = {
    sub: (user as any)._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as any, 
  });
}

export function verifyUserToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as {
    sub: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
  };
}
