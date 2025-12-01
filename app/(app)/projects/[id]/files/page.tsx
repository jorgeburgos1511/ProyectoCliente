import FilesTabClient from "./FilesTabClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectFilesPage({ params }: PageProps) {
  const { id } = await params;
  const projectId = id;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Archivos</h1>
      <FilesTabClient projectId={projectId} />
    </div>
  );
}


