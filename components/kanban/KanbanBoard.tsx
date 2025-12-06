"use client";

import * as React from "react";
import Column from "@/components/kanban/Column";
import { fetchTasks, type Task, updateTask } from "@/services/api/tasks.service";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin, isManager } from "@/lib/roles";
import { fetchUsers, type SimpleUser } from "@/services/api/users-public.service";

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [assigneeMap, setAssigneeMap] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTasks({ projectId });
      setTasks(data);
    } catch {
      // noop; UI de kanban es best-effort
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Para admin/manager, construir mapa id -> "Nombre (email)" para mostrar en badges
  React.useEffect(() => {
    let mounted = true;
    async function loadUsersForRole() {
      if (!(isAdmin(user) || isManager(user))) {
        setAssigneeMap({});
        return;
      }
      try {
        // admin: ve todos; manager: solo developers de su dominio (servidor filtra automáticamente)
        const us = await fetchUsers({ role: "developer" });
        if (!mounted) return;
        const map: Record<string, string> = {};
        us.forEach((u: SimpleUser) => {
          map[u.id] = `${u.name} (${u.email})`;
        });
        setAssigneeMap(map);
      } catch {
        if (mounted) setAssigneeMap({});
      }
    }
    loadUsersForRole();
    return () => {
      mounted = false;
    };
  }, [user]);

  const todo = React.useMemo(() => tasks.filter((t) => t.status === "Todo"), [tasks]);
  const doing = React.useMemo(() => tasks.filter((t) => t.status === "Doing"), [tasks]);
  const done = React.useMemo(() => tasks.filter((t) => t.status === "Done"), [tasks]);

  const handleTaskDrop = async (taskId: string, newStatus: Task["status"]) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    try {
      await updateTask(taskId, { status: newStatus });
    } catch {
      // Rollback by reloading if update fails
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Column
        title="Todo"
        tasks={todo}
        assigneeNameById={assigneeMap}
        status="Todo"
        onTaskDrop={handleTaskDrop}
      />
      <Column
        title="Doing"
        tasks={doing}
        assigneeNameById={assigneeMap}
        status="Doing"
        onTaskDrop={handleTaskDrop}
      />
      <Column
        title="Done"
        tasks={done}
        assigneeNameById={assigneeMap}
        status="Done"
        onTaskDrop={handleTaskDrop}
      />
    </div>
  );
}
