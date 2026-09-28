"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import { getCatalogItem, ROOM_WIDTH, ROOM_DEPTH } from "@/lib/catalog";
import { canPlaceOnDesk, canPlaceOnFloor } from "@/lib/rules";
import type {
  GridPosition,
  PlacedDeskItem,
  PlacedFloorItem,
} from "@/lib/types";
import type { DurationOption } from "@/lib/pricing";
import type { Persona } from "@/lib/personas";

interface DesignSnapshot {
  floorItems: PlacedFloorItem[];
  deskItems: PlacedDeskItem[];
}

/** What the player currently has "in hand":
 *  - "floor": a brand-new catalog item, chosen (with optional color) from the
 *    preview modal, waiting for a tile click to place it.
 *  - "move": an *already-placed* floor item being relocated — picked up via
 *    its on-canvas toolbar, waiting for a tile click to drop it again.
 * Desk-slot items (monitors/accessories) skip this entirely — they're placed
 * immediately onto whichever desk is selected, see addDeskSlotItem. */
export type PendingPlacement =
  | { kind: "floor"; catalogId: string; color?: string }
  | { kind: "move"; instanceId: string; catalogId: string }
  | null;

interface DesignState {
  floorItems: PlacedFloorItem[];
  deskItems: PlacedDeskItem[];
  pending: PendingPlacement;
  lastError: string | null;
  duration: DurationOption;
  cycles: number;
  history: DesignSnapshot[];
  future: DesignSnapshot[];
  selectedDeskInstanceId: string | null;
  /** Generic "which floor item is highlighted" state — separate from
   * selectedDeskInstanceId, which specifically means "receives new desk-slot
   * items". Drives the on-canvas Move/Rotate/Remove toolbar. */
  selectedFloorInstanceId: string | null;

  setPending: (p: PendingPlacement) => void;
  clearPending: () => void;
  placeFloorItem: (pos: GridPosition, rotationY?: 0 | 90 | 180 | 270) => void;
  moveFloorItem: (instanceId: string, pos: GridPosition) => void;
  beginMoveFloorItem: (instanceId: string) => void;
  addDeskSlotItem: (catalogId: string, color?: string) => void;
  removeFloorItem: (instanceId: string) => void;
  removeDeskItem: (instanceId: string) => void;
  rotateFloorItem: (instanceId: string) => void;
  selectDesk: (instanceId: string | null) => void;
  selectFloorItem: (instanceId: string | null) => void;
  setDuration: (d: DurationOption) => void;
  setCycles: (c: number) => void;
  applyPersona: (persona: Persona) => void;
  /** Used by the AI advisor: auto-places catalog items wherever they fit
   * (floor items find the first free tile; monitors/accessories go on the
   * first desk, placing a default desk first if none exists yet). */
  applySuggestedItems: (catalogIds: string[]) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  loadDesign: (snap: DesignSnapshot) => void;
}

function snapshot(state: DesignState): DesignSnapshot {
  return {
    floorItems: state.floorItems.map((f) => ({ ...f })),
    deskItems: state.deskItems.map((d) => ({ ...d })),
  };
}

export const useDesignStore = create<DesignState>((set, get) => ({
  floorItems: [],
  deskItems: [],
  pending: null,
  lastError: null,
  duration: "week",
  cycles: 1,
  history: [],
  future: [],
  selectedDeskInstanceId: null,
  selectedFloorInstanceId: null,

  setPending: (p) => set({ pending: p, lastError: null }),
  clearPending: () => set({ pending: null }),

  placeFloorItem: (pos, rotationY = 0) => {
    const { pending, floorItems } = get();
    if (!pending || pending.kind !== "floor") return;
    const item = getCatalogItem(pending.catalogId);
    if (!item) return;

    const result = canPlaceOnFloor(item, pos, rotationY, floorItems);
    if (!result.valid) {
      set({ lastError: result.reason ?? "Can't place that there." });
      return;
    }

    const newItem: PlacedFloorItem = {
      instanceId: nanoid(8),
      catalogId: item.id,
      position: pos,
      rotationY,
      color: pending.color,
    };

    set((state) => ({
      history: [...state.history, snapshot(state)],
      future: [],
      floorItems: [...state.floorItems, newItem],
      pending: null,
      lastError: null,
    }));
  },

  beginMoveFloorItem: (instanceId) => {
    const target = get().floorItems.find((f) => f.instanceId === instanceId);
    if (!target) return;
    set({
      pending: { kind: "move", instanceId, catalogId: target.catalogId },
      selectedFloorInstanceId: null,
      lastError: null,
    });
  },

  moveFloorItem: (instanceId, pos) => {
    const { floorItems } = get();
    const target = floorItems.find((f) => f.instanceId === instanceId);
    if (!target) return;
    const item = getCatalogItem(target.catalogId);
    if (!item) return;

    const result = canPlaceOnFloor(item, pos, target.rotationY, floorItems, instanceId);
    if (!result.valid) {
      set({ lastError: result.reason ?? "Can't move it there." });
      return;
    }

    set((state) => ({
      history: [...state.history, snapshot(state)],
      future: [],
      floorItems: state.floorItems.map((f) =>
        f.instanceId === instanceId ? { ...f, position: pos } : f,
      ),
      pending: null,
      lastError: null,
    }));
  },

  addDeskSlotItem: (catalogId, color) => {
    const { selectedDeskInstanceId, floorItems, deskItems } = get();
    if (!selectedDeskInstanceId) {
      set({ lastError: "Select a desk first — click one in the room." });
      return;
    }
    const item = getCatalogItem(catalogId);
    if (!item) return;

    const desk = floorItems.find((f) => f.instanceId === selectedDeskInstanceId);
    if (!desk) return;

    const result = canPlaceOnDesk(item, desk, deskItems);
    if (!result.valid) {
      set({ lastError: result.reason ?? "Can't place that on this desk." });
      return;
    }

    const slotIndex = deskItems.filter((d) => d.deskInstanceId === desk.instanceId).length;
    const newItem: PlacedDeskItem = {
      instanceId: nanoid(8),
      catalogId: item.id,
      deskInstanceId: desk.instanceId,
      slotIndex,
      color,
    };

    set((state) => ({
      history: [...state.history, snapshot(state)],
      future: [],
      deskItems: [...state.deskItems, newItem],
      lastError: null,
    }));
  },

  removeFloorItem: (instanceId) => {
    set((state) => ({
      history: [...state.history, snapshot(state)],
      future: [],
      floorItems: state.floorItems.filter((f) => f.instanceId !== instanceId),
      // Removing a desk also removes anything sitting on it.
      deskItems: state.deskItems.filter((d) => d.deskInstanceId !== instanceId),
      selectedDeskInstanceId:
        state.selectedDeskInstanceId === instanceId ? null : state.selectedDeskInstanceId,
      selectedFloorInstanceId:
        state.selectedFloorInstanceId === instanceId ? null : state.selectedFloorInstanceId,
    }));
  },

  removeDeskItem: (instanceId) => {
    set((state) => ({
      history: [...state.history, snapshot(state)],
      future: [],
      deskItems: state.deskItems.filter((d) => d.instanceId !== instanceId),
    }));
  },

  rotateFloorItem: (instanceId) => {
    set((state) => {
      const target = state.floorItems.find((f) => f.instanceId === instanceId);
      if (!target) return state;
      const nextRotation = ((target.rotationY + 90) % 360) as 0 | 90 | 180 | 270;
      const item = getCatalogItem(target.catalogId);
      if (!item) return state;
      const result = canPlaceOnFloor(
        item,
        target.position,
        nextRotation,
        state.floorItems,
        target.instanceId,
      );
      if (!result.valid) {
        return { ...state, lastError: result.reason ?? "Can't rotate here." };
      }
      return {
        ...state,
        history: [...state.history, snapshot(state)],
        future: [],
        floorItems: state.floorItems.map((f) =>
          f.instanceId === instanceId ? { ...f, rotationY: nextRotation } : f,
        ),
      };
    });
  },

  selectDesk: (instanceId) => set({ selectedDeskInstanceId: instanceId }),
  selectFloorItem: (instanceId) => set({ selectedFloorInstanceId: instanceId }),
  setDuration: (d) => set({ duration: d }),
  setCycles: (c) => set({ cycles: Math.max(1, c) }),

  applyPersona: (persona) => {
    set((state) => ({ history: [...state.history, snapshot(state)], future: [] }));

    const floorItems: PlacedFloorItem[] = [];
    let firstDeskInstanceId: string | null = null;

    for (const p of persona.floor) {
      const item = getCatalogItem(p.catalogId);
      if (!item) continue;
      const pos = { x: p.x, z: p.z };
      const result = canPlaceOnFloor(item, pos, 0, floorItems);
      if (!result.valid) continue;
      const instanceId = nanoid(8);
      floorItems.push({ instanceId, catalogId: item.id, position: pos, rotationY: 0 });
      if (item.category === "desk" && !firstDeskInstanceId) {
        firstDeskInstanceId = instanceId;
      }
    }

    const deskItems: PlacedDeskItem[] = [];
    if (firstDeskInstanceId) {
      const desk = floorItems.find((f) => f.instanceId === firstDeskInstanceId)!;
      persona.deskSlots.forEach((catalogId) => {
        const item = getCatalogItem(catalogId);
        if (!item) return;
        const result = canPlaceOnDesk(item, desk, deskItems);
        if (!result.valid) return;
        const slotIndex = deskItems.filter((d) => d.deskInstanceId === desk.instanceId).length;
        deskItems.push({ instanceId: nanoid(8), catalogId, deskInstanceId: desk.instanceId, slotIndex });
      });
    }

    set({
      floorItems,
      deskItems,
      pending: null,
      lastError: null,
      selectedDeskInstanceId: null,
      selectedFloorInstanceId: null,
    });
  },

  applySuggestedItems: (catalogIds) => {
    set((state) => ({ history: [...state.history, snapshot(state)], future: [] }));

    const { floorItems: currentFloor, deskItems: currentDesk } = get();
    const floorItems = [...currentFloor];
    const deskItems = [...currentDesk];

    function findFreeTile(item: NonNullable<ReturnType<typeof getCatalogItem>>): GridPosition | null {
      for (let z = 0; z < ROOM_DEPTH; z++) {
        for (let x = 0; x < ROOM_WIDTH; x++) {
          const pos = { x, z };
          if (canPlaceOnFloor(item, pos, 0, floorItems).valid) return pos;
        }
      }
      return null;
    }

    let firstDeskInstanceId = floorItems.find((f) => getCatalogItem(f.catalogId)?.category === "desk")
      ?.instanceId ?? null;

    // Floor items first (desks/chairs/break-corner), so a desk exists before
    // we try to attach monitors/accessories to it.
    const sorted = [...catalogIds].sort((a, b) => {
      const ac = getCatalogItem(a)?.placement === "floor" ? 0 : 1;
      const bc = getCatalogItem(b)?.placement === "floor" ? 0 : 1;
      return ac - bc;
    });

    for (const catalogId of sorted) {
      const item = getCatalogItem(catalogId);
      if (!item) continue;

      if (item.placement === "floor") {
        const pos = findFreeTile(item);
        if (!pos) continue;
        const instanceId = nanoid(8);
        floorItems.push({ instanceId, catalogId: item.id, position: pos, rotationY: 0 });
        if (item.category === "desk" && !firstDeskInstanceId) firstDeskInstanceId = instanceId;
      } else {
        if (!firstDeskInstanceId) continue; // no desk to attach to — skip gracefully
        const desk = floorItems.find((f) => f.instanceId === firstDeskInstanceId)!;
        const result = canPlaceOnDesk(item, desk, deskItems);
        if (!result.valid) continue;
        const slotIndex = deskItems.filter((d) => d.deskInstanceId === desk.instanceId).length;
        deskItems.push({ instanceId: nanoid(8), catalogId: item.id, deskInstanceId: desk.instanceId, slotIndex });
      }
    }

    set({ floorItems, deskItems, lastError: null });
  },

  reset: () => {
    set((state) => ({
      history: [...state.history, snapshot(state)],
      future: [],
      floorItems: [],
      deskItems: [],
      pending: null,
      lastError: null,
      selectedDeskInstanceId: null,
      selectedFloorInstanceId: null,
    }));
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        history: state.history.slice(0, -1),
        future: [...state.future, snapshot(state)],
        floorItems: previous.floorItems,
        deskItems: previous.deskItems,
        pending: null,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[state.future.length - 1];
      return {
        ...state,
        future: state.future.slice(0, -1),
        history: [...state.history, snapshot(state)],
        floorItems: next.floorItems,
        deskItems: next.deskItems,
        pending: null,
      };
    });
  },

  loadDesign: (snap) => set({ floorItems: snap.floorItems, deskItems: snap.deskItems, history: [], future: [] }),
}));
