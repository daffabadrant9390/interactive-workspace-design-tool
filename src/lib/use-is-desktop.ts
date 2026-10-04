"use client";

import { useEffect, useState } from "react";

/** Below this, the 3-column layout (catalog | 3D room | setup) stops fitting comfortably. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * The one flag the responsive layout is built around (WorkspaceApp.tsx).
 * Defaults to true so desktop — today's primary audience — renders its
 * normal layout immediately with no flash; a mobile visitor sees a brief
 * correction to the compact layout right after mount instead.
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}
