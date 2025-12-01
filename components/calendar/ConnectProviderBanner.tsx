"use client";

import { Button } from "@/components/ui/button";

export default function ConnectProviderBanner({
  onConnect,
}: {
  onConnect?: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="text-sm font-semibold">Conectar proveedor de calendario</div>
          <p className="text-xs text-muted-foreground">
            Integra tu calendario (Google/Outlook) para ver eventos. Esta demo no realiza
            ninguna integración real.
          </p>
        </div>
        <Button size="sm" onClick={onConnect}>
          Conectar proveedor
        </Button>
      </div>
    </div>
  );
}
