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
  getAuthUser,
  setAuthUser,
} from "@/services/api/auth.service";

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedToken = getAuthToken();
      if (savedToken) {
        setToken(savedToken);
        const savedUser = getAuthUser();
        if (savedUser) {
          setUser(savedUser);
        }
      }
    } catch (e) {
      console.error("Error rehidratando sesión:", e);
      setAuthToken(null);
      setAuthUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const commonLoginFlow = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    setAuthToken(t);
    setAuthUser(u);
    toast.success("Sesión iniciada");
    router.push("/dashboard");
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user, token } = await loginWithCredentials(email, password);
      commonLoginFlow(user, token);
    } catch (err) {
      console.error(err);
      toast.destructive("Credenciales inválidas");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { user, token } = await registerAccount(name, email, password);
      commonLoginFlow(user, token);
    } catch (err) {
      console.error(err);
      toast.destructive("No se pudo registrar la cuenta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (code: string) => {
    setLoading(true);
    try {
      const { user, token } = await loginWithGoogleAuthCode(code);
      commonLoginFlow(user, token);
    } catch (err) {
      console.error(err);
      toast.destructive("No fue posible iniciar sesión con Google");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setAuthToken(null);
      setAuthUser(null);
      setUser(null);
      setToken(null);
      toast.info("Sesión cerrada");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
