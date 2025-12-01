"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import ProjectPresence from "@/components/realtime/ProjectPresence";
import TaskEventsDemo from "@/components/realtime/TaskEventsDemo";

export default function KanbanPageClient() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ProjectPresence projectId={projectId} />
        <TaskEventsDemo projectId={projectId} />
      </div>
      <KanbanBoard projectId={projectId} />
    </div>
  );
}
