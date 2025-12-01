"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

import {
  loginWithCredentials,
  registerAccount,
  loginWithGoogleAuthCode,
  getAuthToken,
  setAuthToken,
} from "@/services/api/auth.service";

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;   // ← agregado
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ---------------------------------------------------------------------
  // REFRESCAR USUARIO desde el backend
  // ---------------------------------------------------------------------
  async function refreshUser() {
    try {
      const savedToken = getAuthToken();
      if (!savedToken) return;

      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error("Error al refrescar usuario:", err);
    }
  }

  // ---------------------------------------------------------------------
  // Cargar token del localStorage al iniciar la app
  // ---------------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = getAuthToken();
      if (saved) {
        setTokenState(saved);
        refreshUser();
      }
    } catch (e) {
      console.error("Error leyendo token almacenado:", e);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------
  // FLUJO DE LOGIN GENERAL
  // ---------------------------------------------------------------------
  const commonLoginFlow = (u: User, t: string) => {
    setUser(u);
    setTokenState(t);
    setAuthToken(t);
    toast.success("Sesión iniciada");
    router.push("/dashboard");
  };

  // ---------------------------------------------------------------------
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user, token } = await loginWithCredentials(email, password);
      commonLoginFlow(user, token);
    } catch (err) {
      toast.destructive("Credenciales inválidas");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { user, token } = await registerAccount(name, email, password);
      commonLoginFlow(user, token);
    } catch (err) {
      toast.destructive("No se pudo registrar la cuenta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  const loginWithGoogle = async (code: string) => {
    setLoading(true);
    try {
      const { user, token } = await loginWithGoogleAuthCode(code);
      commonLoginFlow(user, token);
    } catch (err) {
      toast.destructive("No fue posible iniciar sesión con Google");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  const logout = async () => {
    setLoading(true);
    try {
      setAuthToken(null);
      setUser(null);
      setTokenState(null);
      toast.info("Sesión cerrada");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser, // ← agregado al provider
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
