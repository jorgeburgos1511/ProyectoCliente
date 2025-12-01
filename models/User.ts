import { Schema, model, models } from "mongoose";

export type UserRole = "admin" | "manager" | "developer";

export interface IUser {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  provider: "credentials" | "google";
  googleId?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: { type: String },

    role: {
      type: String,
      enum: ["admin", "manager", "developer"],
      default: "developer",
    },

    provider: {
      type: String,
      enum: ["credentials", "google"],
      required: true,
    },

    googleId: { type: String },

    // Foto de perfil
    avatarUrl: {
      type: String,
      default: "/images/avatar1.png",
    },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
