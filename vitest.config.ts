import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Coverage is scoped to the logic layer that can be meaningfully unit
      // tested in Node/jsdom: rules, pricing, catalog, the Zustand store, the
      // pure grid-math helpers, and the API route handlers.
      //
      // Deliberately EXCLUDED: React Three Fiber / Three.js scene components
      // (Scene, RoomFloor, FloorFurniture, GhostPreview, DeskSlotItem,
      // PartsGroup, ItemThumbnail) and page/layout boilerplate. jsdom has no
      // WebGL context, so "testing" a <Canvas> tree means mocking Three.js
      // into oblivion — the resulting test would assert that the mocks were
      // called, not that anything renders correctly. That belongs to visual
      // regression / Playwright, called out in the README as a next step,
      // not to this unit-test layer.
      include: [
        "src/lib/**/*.ts",
        "src/store/**/*.ts",
        "src/components/scene/layout.ts",
        "src/app/api/**/*.ts",
      ],
      exclude: [
        "src/lib/db/**",
        "**/*.d.ts",
        "**/types.ts",
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
});
