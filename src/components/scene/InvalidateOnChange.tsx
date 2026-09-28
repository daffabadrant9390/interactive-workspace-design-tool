"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { useDesignStore } from "@/store/design-store";

/**
 * The canvas uses frameloop="demand" (see Scene.tsx) — nothing renders on a
 * timer, only when something actually changes. OrbitControls invalidates on
 * its own when the camera moves; this component covers everything else
 * (placing/removing/rotating items, hover state) by invalidating whenever
 * the store's floor/desk contents change.
 */
export function InvalidateOnChange() {
  const invalidate = useThree((s) => s.invalidate);
  const floorItems = useDesignStore((s) => s.floorItems);
  const deskItems = useDesignStore((s) => s.deskItems);
  const pending = useDesignStore((s) => s.pending);
  const selectedDeskInstanceId = useDesignStore((s) => s.selectedDeskInstanceId);

  useEffect(() => {
    invalidate();
  }, [invalidate, floorItems, deskItems, pending, selectedDeskInstanceId]);

  return null;
}
