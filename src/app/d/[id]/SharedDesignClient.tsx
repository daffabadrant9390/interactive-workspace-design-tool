"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useDesignStore } from "@/store/design-store";
import { WorkspaceApp } from "@/components/ui/WorkspaceApp";
import type { PlacedDeskItem, PlacedFloorItem } from "@/lib/types";
import type { DurationOption } from "@/lib/pricing";

interface DesignRow {
  id: string;
  name: string;
  floorItems: unknown;
  deskItems: unknown;
  duration: string;
  cycles: number;
}

export function SharedDesignClient({ design }: { design: DesignRow }) {
  const loadDesign = useDesignStore((s) => s.loadDesign);
  const setDuration = useDesignStore((s) => s.setDuration);
  const setCycles = useDesignStore((s) => s.setCycles);
  const loadedOnce = useRef(false);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;
    loadDesign({
      floorItems: design.floorItems as PlacedFloorItem[],
      deskItems: design.deskItems as PlacedDeskItem[],
    });
    setDuration(design.duration as DurationOption);
    setCycles(design.cycles);
  }, [design, loadDesign, setDuration, setCycles]);

  return (
    <WorkspaceApp
      banner={
        <div className="flex items-center justify-between border-b border-accent/30 bg-accent/10 px-4 py-2 text-xs text-accent">
          <span>
            Viewing a saved design — feel free to tweak it, it won&apos;t overwrite the original link.
          </span>
          <Link href="/" className="font-semibold underline">
            Start a new design
          </Link>
        </div>
      }
    />
  );
}
