import Column from "@/components/kanban/Column";
import { listTasks, type Task } from "@/services/mock/tasks.service";

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const tasks = listTasks(projectId);
  const byStatus = (status: Task["status"]) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Column title="Todo" tasks={byStatus("Todo")} />
      <Column title="Doing" tasks={byStatus("Doing")} />
      <Column title="Done" tasks={byStatus("Done")} />
    </div>
  );
}
