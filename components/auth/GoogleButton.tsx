"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

export default function GoogleButton() {
  const { loginWithGoogle } = useAuth();

  // Usar popup (sin redirect) para evitar tener que pulsar dos veces.
  // El modo redirect requiere manejar el código tras volver a / (lo cual
  // no está implementado en esta app); con popup el código llega de inmediato.
  const login = useGoogleLogin({
    flow: "auth-code",
    scope: "openid profile email",
    onSuccess: async ({ code }) => {
      try {
        await loginWithGoogle(code);
      } catch (error) {
        console.error(error);
        toast.destructive("Ocurrió un error al iniciar sesión con Google");
      }
    },
    onError: () => {
      toast.destructive("No se pudo iniciar sesión con Google");
    },
  });

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center gap-2"
      onClick={() => login()}
    >
      {}
      <svg
        className="h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
      >
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A11.9 11.9 0 0112 28a12 12 0 0120.5-8.5l5.7-5.7A20 20 0 004 28a20 20 0 0036 12 19.9 19.9 0 003.6-19.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A11.9 11.9 0 0124 16a12 12 0 018.5-3.5 11.9 11.9 0 014 1l6.6-6.6A19.9 19.9 0 0024 4 20 20 0 006.3 14.7z" />
        <path fill="#4CAF50" d="M24 44a20 20 0 0014.3-6l-6.6-5.7A12 12 0 0124 36a11.9 11.9 0 01-8.5-3.5l-6.6 5.7A20 20 0 0024 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 01-4 5.2l6.6 5.7A20 20 0 0044 28c0-2.6-.5-5.1-1.4-7.5z" />
      </svg>

      Continuar con Google
    </Button>
  );
}
