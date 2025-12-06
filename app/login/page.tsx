import Link from "next/link";
import { AuthCard } from "@/components/forms/AuthCard";
import GoogleButton from "@/components/auth/GoogleButton";

export const metadata = {
  title: "Ingresar | TaskFlow",
};

export default function LoginPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión con tu correo y contraseña o utiliza tu cuenta de Google
            para acceder a la aplicación.
          </p>
        </header>

        <div className="mx-auto max-w-md space-y-6">
          <AuthCard mode="login" />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span>o continúa con</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <GoogleButton />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-foreground underline underline-offset-4"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}

