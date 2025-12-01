"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-56px-56px)] grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-sidebar md:block">
        <Sidebar />
      </aside>
      <section className="flex min-h-full flex-col">
        <Topbar />
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </section>
    </div>
  );
}
