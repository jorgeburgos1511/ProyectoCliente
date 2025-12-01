import Link from "next/link";
import { AuthCard } from "@/components/forms/AuthCard";

export const metadata = {
  title: "Registro | TaskFlow",
};

export default function RegisterPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Crear cuenta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Registra tus datos para comenzar a utilizar TaskFlow.
          </p>
        </header>

        <div className="mx-auto max-w-md">
          <AuthCard mode="register" />
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="text-foreground underline underline-offset-4"
          >
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  );
}

