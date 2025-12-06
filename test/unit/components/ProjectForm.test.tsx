import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectForm from "@/components/forms/ProjectForm";
import type { Project } from "@/services/api/projects.service";

const { createProjectMock, updateProjectMock } = vi.hoisted(() => ({
  createProjectMock: vi.fn(),
  updateProjectMock: vi.fn(),
}));

vi.mock("@/services/api/projects.service", () => {
  return {
    createProject: (...args: any[]) => createProjectMock(...args),
    updateProject: (...args: any[]) => updateProjectMock(...args),
  };
});

describe("ProjectForm (name, key, dueDate)", () => {
  beforeEach(() => {
    createProjectMock.mockReset();
    updateProjectMock.mockReset();
  });

  it("muestra errores de validación cuando faltan datos requeridos", async () => {
    render(<ProjectForm />);

    const submit = screen.getByRole("button", { name: /crear/i });
    await userEvent.click(submit);

    expect(await screen.findByText(/nombre requerido/i)).toBeInTheDocument();
    expect(await screen.findByText(/min 2 caracteres/i)).toBeInTheDocument();
  });

  it("convierte la clave a mayúsculas y crea proyecto con datos válidos", async () => {
    const saved: Project = {
      id: "p1",
      name: "Proyecto A",
      key: "PA1",
      ownerId: "u1",
      members: ["u1", "u2"],
    };

    createProjectMock.mockResolvedValueOnce(saved);

    const onSaved = vi.fn();
    render(<ProjectForm onSaved={onSaved} />);

    await userEvent.type(screen.getByPlaceholderText("TaskFlow"), "Proyecto A");
    const keyInput = screen.getByPlaceholderText("TF");
    await userEvent.type(keyInput, "pa1");
    expect((keyInput as HTMLInputElement).value).toBe("PA1");

    const submit = screen.getByRole("button", { name: /^crear$/i });
    await userEvent.click(submit);

    expect(createProjectMock).toHaveBeenCalledTimes(1);
    expect(createProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Proyecto A",
        key: "PA1",
      })
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("actualiza proyecto cuando recibe 'initial'", async () => {
    const initial: Project = {
      id: "pid",
      name: "Init",
      key: "INIT",
      ownerId: "u1",
      members: ["u1"],
    };

    updateProjectMock.mockResolvedValueOnce({ ...initial, name: "Init-Edit" });

    render(<ProjectForm initial={initial} />);

    const nameInput = await screen.findByDisplayValue("Init");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Init-Edit");

    const submit = screen.getByRole("button", { name: /actualizar/i });
    await userEvent.click(submit);

    expect(updateProjectMock).toHaveBeenCalledTimes(1);
    expect(updateProjectMock).toHaveBeenCalledWith(
      "pid",
      expect.objectContaining({
        name: "Init-Edit",
        key: "INIT",
      })
    );
  });
});
