import TaskCard from "@/components/kanban/TaskCard";
import type { Task } from "@/services/mock/tasks.service";

export default function Column({
  title,
  tasks,
}: {
  title: string;
  tasks: Task[];
}) {
  return (
    <div className="flex min-h-[300px] flex-col gap-3 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
        {!tasks.length && (
          <div className="flex flex-1 items-center justify-center rounded border border-dashed py-10 text-xs text-muted-foreground">
            Vacío
          </div>
        )}
      </div>
    </div>
  );
}
