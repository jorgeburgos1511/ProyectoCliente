import type { Task } from "@/services/mock/tasks.service";
import { cn } from "@/lib/utils";

const priorityColor: Record<NonNullable<Task["priority"]>, string> = {
  High: "bg-red-500/15 text-red-700 dark:text-red-300",
  Medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
  Low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div
      className="group cursor-grab rounded-lg border bg-card p-3 active:cursor-grabbing"
      role="button"
      aria-label={`Tarea ${task.title}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium">{task.title}</h4>
        {task.points !== undefined && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {task.points} pts
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {task.priority && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-medium",
              priorityColor[task.priority]
            )}
          >
            {task.priority}
          </span>
        )}
        {task.dueDate && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {(task.tags ?? []).slice(0, 2).map((t) => (
          <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            #{t}
          </span>
        ))}
        {task.tags && task.tags.length > 2 && (
          <span className="text-[10px] text-muted-foreground">+{task.tags.length - 2}</span>
        )}
      </div>
    </div>
  );
}
