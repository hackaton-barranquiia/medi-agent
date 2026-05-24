"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[260px_1fr]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-col overflow-hidden">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="relative flex-1 overflow-y-auto">
          <div className="grain absolute inset-0 -z-0" aria-hidden />
          <div className="relative z-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
