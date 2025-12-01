"use client";

import { useParams } from "next/navigation";
import TasksList from "@/components/tables/TasksList";

export default function ProjectTasksListPage() {
  const params = useParams<{ id: string }>();
  const projectId = (params?.id as string) ?? "p1";

  return (
    <div className="space-y-4">
      <TasksList projectId={projectId} />
    </div>
  );
}
