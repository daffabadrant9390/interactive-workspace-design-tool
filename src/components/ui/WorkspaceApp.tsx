"use client";

import { useState, type ReactNode } from "react";
import { CatalogPanel } from "./CatalogPanel";
import { SummaryPanel } from "./SummaryPanel";
import { Toolbar } from "./Toolbar";
import { AdvisorModal } from "./AdvisorModal";
import { Scene } from "@/components/scene/Scene";

export function WorkspaceApp({ banner }: { banner?: ReactNode }) {
  const [advisorOpen, setAdvisorOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">
            Design Your Workspace <span className="text-muted">· CiptaForge</span>
          </h1>
          <p className="text-xs text-muted">
            Preview an item on the left, then place it in the room. Hover a placed item for move / rotate / remove.
          </p>
        </div>
      </header>

      {banner}
      <Toolbar onOpenAdvisor={() => setAdvisorOpen(true)} />

      <div className="flex min-h-0 flex-1">
        <aside className="w-80 min-h-0 border-r border-border bg-background">
          <CatalogPanel />
        </aside>

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <Scene />
          </div>
        </main>

        <aside className="w-96 min-h-0 border-l border-border bg-background">
          <SummaryPanel />
        </aside>
      </div>

      {advisorOpen && <AdvisorModal onClose={() => setAdvisorOpen(false)} />}
    </div>
  );
}
