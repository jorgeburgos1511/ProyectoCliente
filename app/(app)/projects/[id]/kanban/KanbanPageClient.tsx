"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import KanbanBoard from "@/components/kanban/KanbanBoard";

export default function KanbanPageClient() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  return (
    <div className="space-y-4">
      <KanbanBoard projectId={projectId} />
    </div>
  );
}
