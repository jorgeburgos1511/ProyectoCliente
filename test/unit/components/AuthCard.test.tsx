import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthCard } from "@/components/forms/AuthCard";

// Mocks that we can assert against
const loginMock = vi.fn();
const registerMock = vi.fn();

vi.mock("@/components/providers/AuthProvider", () => {
  return {
    useAuth: () => ({
      login: loginMock,
      register: registerMock,
    }),
  };
});

describe("AuthCard", () => {
  beforeEach(() => {
    loginMock.mockReset();
    registerMock.mockReset();
  });

  it("muestra errores de validación en modo login con campos vacíos", async () => {
    render(<AuthCard mode="login" />);

    const submit = screen.getByRole("button", { name: /ingresar/i });
    await userEvent.click(submit);

    expect(await screen.findByText(/correo requerido/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/al menos 6 caracteres/i)
    ).toBeInTheDocument();
  });

  it("envía el login cuando los campos son válidos", async () => {
    render(<AuthCard mode="login" />);

    await userEvent.type(
      screen.getByLabelText(/correo/i),
      "user@example.com"
    );
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secret1");

    const submit = screen.getByRole("button", { name: /^ingresar$/i });
    await userEvent.click(submit);

    expect(loginMock).toHaveBeenCalledWith("user@example.com", "secret1");
  });

  it("muestra el campo nombre y ejecuta registro en modo register", async () => {
    render(<AuthCard mode="register" />);

    // Nombre visible solo en modo registro
    await userEvent.type(screen.getByLabelText(/nombre/i), "Juan Pérez");
    await userEvent.type(
      screen.getByLabelText(/correo/i),
      "juan@example.com"
    );
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secreto123");

    const submit = screen.getByRole("button", { name: /crear cuenta/i });
    await userEvent.click(submit);

    expect(registerMock).toHaveBeenCalledWith(
      "Juan Pérez",
      "juan@example.com",
      "secreto123"
    );
  });
});
